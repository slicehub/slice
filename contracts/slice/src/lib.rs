#![no_std]
use error::ContractError;
use sha2::{Digest, Sha256};
use soroban_sdk::{contract, contractimpl, Address, Bytes, BytesN, Env, Symbol, Vec};
use types::{Categories, Config, Dispute, DisputeStatus, TimeLimits, ULTRAHONK_CONTRACT_ADDRESS};

mod error;
mod storage;
mod types;
mod xlm;

mod ultrahonk_contract {
    soroban_sdk::contractimport!(file = "ultrahonk_soroban_contract.wasm");
}

#[contract]
pub struct Slice;

#[contractimpl]
impl Slice {
    pub fn __constructor(
        env: Env,
        admin: Address,
        min_pay_seconds: u64,
        max_pay_seconds: u64,
        min_commit_seconds: u64,
        max_commit_seconds: u64,
        min_reveal_seconds: u64,
        max_reveal_seconds: u64,
    ) {
        admin.require_auth();

        let config = Config {
            admin: admin.clone(),
            min_pay_seconds,
            max_pay_seconds,
            min_commit_seconds,
            max_commit_seconds,
            min_reveal_seconds,
            max_reveal_seconds,
        };

        storage::set_config(&env, &config);

        let categories = Categories {
            items: Vec::new(&env),
        };
        storage::set_categories(&env, &categories);
        storage::set_dispute_counter(&env, 0u64);
    }

    pub fn add_category(env: Env, name: Symbol) -> Result<(), ContractError> {
        require_admin(&env)?;

        let mut cats = storage::get_categories(&env);
        if cats.items.contains(&name) {
            return Err(ContractError::ErrAlreadyExists);
        }

        cats.items.push_back(name);
        storage::set_categories(&env, &cats);
        Ok(())
    }

    pub fn remove_category(env: Env, name: Symbol) -> Result<(), ContractError> {
        require_admin(&env)?;

        let mut cats = storage::get_categories(&env);
        let mut found = false;
        let mut new_items = Vec::new(&env);

        for i in 0..cats.items.len() {
            let item = cats.items.get(i).ok_or(ContractError::ErrInternalState)?;
            if item != name {
                new_items.push_back(item);
            } else {
                found = true;
            }
        }

        if !found {
            return Err(ContractError::ErrNotFound);
        }

        cats.items = new_items;
        storage::set_categories(&env, &cats);
        Ok(())
    }

    pub fn create_dispute(
        env: Env,
        claimer: Address,
        defender: Address,
        meta_hash: BytesN<32>,
        min_amount: i128,
        max_amount: i128,
        category: Symbol,
        allowed_jurors: Option<Vec<Address>>,
        jurors_required: u32,
        limits: TimeLimits,
    ) -> Result<u64, ContractError> {
        if !storage::has_category(&env, category.clone()) {
            return Err(ContractError::ErrCategoryNotFound);
        }

        if jurors_required < 5 || jurors_required > 101 || jurors_required % 2 == 0 {
            return Err(ContractError::ErrInvalidJurorCount);
        }

        if min_amount <= 0 || max_amount < min_amount {
            return Err(ContractError::ErrInvalidAmounts);
        }

        let cfg = storage::get_config(&env)?;

        if limits.pay_seconds < cfg.min_pay_seconds || limits.pay_seconds > cfg.max_pay_seconds {
            return Err(ContractError::ErrInvalidDeadline);
        }

        if limits.commit_seconds < cfg.min_commit_seconds
            || limits.commit_seconds > cfg.max_commit_seconds
        {
            return Err(ContractError::ErrInvalidDeadline);
        }

        if limits.reveal_seconds < cfg.min_reveal_seconds
            || limits.reveal_seconds > cfg.max_reveal_seconds
        {
            return Err(ContractError::ErrInvalidDeadline);
        }

        if !(limits.pay_seconds <= limits.commit_seconds
            && limits.commit_seconds <= limits.reveal_seconds)
        {
            return Err(ContractError::ErrInvalidDeadline);
        }

        let id = storage::increment_dispute_counter(&env);
        let now = env.ledger().timestamp();

        let dispute = Dispute {
            id,
            claimer: claimer.clone(),
            defender: defender.clone(),
            meta_hash,
            min_amount,
            max_amount,
            category,
            allowed_jurors,
            jurors_required,

            deadline_pay_seconds: now + limits.pay_seconds,
            deadline_commit_seconds: now + limits.commit_seconds,
            deadline_reveal_seconds: now + limits.reveal_seconds,

            assigned_jurors: Vec::new(&env),
            juror_stakes: Vec::new(&env),

            commitments: Vec::new(&env),
            revealed_votes: Vec::new(&env),
            revealed_salts: Vec::new(&env),

            status: DisputeStatus::Created,
            claimer_paid: false,
            defender_paid: false,
            claimer_amount: 0,
            defender_amount: 0,
            winner: None,
        };

        storage::set_dispute(&env, &dispute);
        Ok(id)
    }

    pub fn pay_dispute(
        env: Env,
        caller: Address,
        dispute_id: u64,
        amount: i128,
    ) -> Result<(), ContractError> {
        caller.require_auth();

        let mut dispute = storage::get_dispute(&env, dispute_id)?;

        if dispute.status != DisputeStatus::Created {
            return Err(ContractError::ErrAlreadyPaid);
        }

        if caller != dispute.claimer && caller != dispute.defender {
            return Err(ContractError::ErrUnauthorized);
        }

        let now = env.ledger().timestamp();
        if now > dispute.deadline_pay_seconds {
            return Err(ContractError::ErrDeadlineReached);
        }

        if amount < dispute.min_amount || amount > dispute.max_amount {
            return Err(ContractError::ErrInvalidAmount);
        }

        if caller == dispute.claimer {
            if dispute.claimer_paid {
                return Err(ContractError::ErrAlreadyPaid);
            }
            dispute.claimer_paid = true;
            dispute.claimer_amount = amount;
        } else {
            if dispute.defender_paid {
                return Err(ContractError::ErrAlreadyPaid);
            }
            dispute.defender_paid = true;
            dispute.defender_amount = amount;
        }

        if dispute.claimer_paid && dispute.defender_paid {
            dispute.status = DisputeStatus::Commit;
        }

        storage::set_dispute(&env, &dispute);
        Ok(())
    }

    pub fn assign_dispute(
        env: Env,
        caller: Address,
        category: Symbol,
        stake_amount: i128,
    ) -> Result<(u64, Address), ContractError> {
        caller.require_auth();

        if !storage::has_category(&env, category.clone()) {
            return Err(ContractError::ErrCategoryNotFound);
        }

        let mut eligible = Vec::new(&env);
        let count = storage::get_dispute_counter(&env);

        for i in 1..=count {
            if let Ok(dispute) = storage::get_dispute(&env, i) {
                if dispute.status == DisputeStatus::Commit
                    && dispute.category == category
                    && (dispute.assigned_jurors.len() as u32) < dispute.jurors_required
                {
                    if let Some(ref allowed) = dispute.allowed_jurors {
                        if allowed.contains(&caller) {
                            eligible.push_back(i);
                        }
                    } else {
                        eligible.push_back(i);
                    }
                }
            }
        }

        if eligible.is_empty() {
            return Err(ContractError::ErrNoAvailableDisputes);
        }

        let dispute_id = eligible.get(0).ok_or(ContractError::ErrInternalState)?;
        let mut dispute = storage::get_dispute(&env, dispute_id)?;

        if stake_amount < dispute.min_amount || stake_amount > dispute.max_amount {
            return Err(ContractError::ErrStakeOutOfRange);
        }

        if (dispute.assigned_jurors.len() as u32) >= dispute.jurors_required {
            return Err(ContractError::ErrDisputeFull);
        }

        if let Some(ref allowed) = dispute.allowed_jurors {
            if !allowed.contains(&caller) {
                return Err(ContractError::ErrNotAllowedJuror);
            }
        }

        if dispute.assigned_jurors.contains(&caller) {
            return Err(ContractError::ErrAlreadyJuror);
        }

        dispute.assigned_jurors.push_back(caller.clone());
        dispute.juror_stakes.push_back(stake_amount);

        dispute.commitments.push_back(None);
        dispute.revealed_votes.push_back(None);
        dispute.revealed_salts.push_back(None);

        storage::set_dispute(&env, &dispute);
        Ok((dispute_id, caller))
    }

    pub fn commit_vote(
        env: Env,
        caller: Address,
        dispute_id: u64,
        commitment: BytesN<32>,
    ) -> Result<(), ContractError> {
        caller.require_auth();

        let mut dispute = storage::get_dispute(&env, dispute_id)?;

        if dispute.status != DisputeStatus::Commit {
            return Err(ContractError::ErrVotingClosed);
        }

        if !dispute.assigned_jurors.contains(&caller) {
            return Err(ContractError::ErrNotJuror);
        }

        let now = env.ledger().timestamp();
        if now > dispute.deadline_commit_seconds {
            return Err(ContractError::ErrVotingClosed);
        }

        let idx = dispute
            .assigned_jurors
            .iter()
            .position(|addr| addr == caller)
            .ok_or(ContractError::ErrNotJuror)? as u32;

        if dispute
            .commitments
            .get(idx)
            .ok_or(ContractError::ErrInternalState)?
            .is_some()
        {
            return Err(ContractError::ErrAlreadyVoted);
        }

        dispute.commitments.set(idx, Some(commitment));

        let mut all_committed = true;
        for i in 0..dispute.commitments.len() {
            if dispute
                .commitments
                .get(i)
                .ok_or(ContractError::ErrInternalState)?
                .is_none()
            {
                all_committed = false;
                break;
            }
        }
        let jurors_joined = dispute.assigned_jurors.len() as u32;
        if all_committed && jurors_joined >= dispute.jurors_required {
            dispute.status = DisputeStatus::Reveal;
        }
        storage::set_dispute(&env, &dispute);
        Ok(())
    }

    pub fn reveal_vote(
        env: Env,
        caller: Address,
        dispute_id: u64,
        vote: u32,
        salt: BytesN<32>,
        vk_json: Bytes,
        proof_blob: Bytes,
    ) -> Result<(), ContractError> {
        caller.require_auth();

        let mut dispute = storage::get_dispute(&env, dispute_id)?;

        maybe_start_reveal_phase(&env, &mut dispute)?;

        if dispute.status != DisputeStatus::Reveal {
            return Err(ContractError::ErrRevealPhaseNotStarted);
        }

        let now = env.ledger().timestamp();
        if now > dispute.deadline_reveal_seconds {
            return Err(ContractError::ErrRevealClosed);
        }

        if !dispute.assigned_jurors.contains(&caller) {
            return Err(ContractError::ErrNotJuror);
        }

        let idx = dispute
            .assigned_jurors
            .iter()
            .position(|a| a == caller)
            .ok_or(ContractError::ErrNotJuror)? as u32;

        if dispute
            .revealed_votes
            .get(idx)
            .ok_or(ContractError::ErrInternalState)?
            .is_some()
        {
            return Err(ContractError::ErrAlreadyVoted);
        }

        let stored_commit = dispute
            .commitments
            .get(idx)
            .ok_or(ContractError::ErrInternalState)?
            .ok_or(ContractError::ErrInvalidProof)?;

        // // 1. Verify ZK proof via UltraHonk
        // let addr = Address::from_str(&env, ULTRAHONK_CONTRACT_ADDRESS);
        // let client = ultrahonk_contract::Client::new(&env, &addr);

        // match client.try_verify_proof(&vk_json, &proof_blob) {
        //     Ok(Ok(_)) => {}
        //     _ => return Err(ContractError::ErrInvalidProof),
        // }

        // // 2. Verify SHA256(vote || salt) == commitment
        let computed = compute_commitment(&env, vote, &salt)?;
        if computed != stored_commit {
            return Err(ContractError::ErrInvalidProof);
        }

        // 3. Store reveal
        dispute.revealed_votes.set(idx, Some(vote));
        dispute.revealed_salts.set(idx, Some(salt));

        storage::set_dispute(&env, &dispute);
        Ok(())
    }

    pub fn execute(env: Env, dispute_id: u64) -> Result<Address, ContractError> {
        let mut dispute = storage::get_dispute(&env, dispute_id)?;

        maybe_start_reveal_phase(&env, &mut dispute)?;

        if dispute.status != DisputeStatus::Reveal {
            return Err(ContractError::ErrNotActive);
        }

        let now = env.ledger().timestamp();
        let juror_count = dispute.assigned_jurors.len();

        let mut all_revealed = true;
        for i in 0..juror_count {
            if dispute
                .revealed_votes
                .get(i)
                .ok_or(ContractError::ErrInternalState)?
                .is_none()
            {
                all_revealed = false;
                break;
            }
        }

        if !all_revealed && now <= dispute.deadline_reveal_seconds {
            return Err(ContractError::ErrRevealNotFinished);
        }

        let mut votes_claimer = 0;
        let mut votes_defender = 0;

        for i in 0..juror_count {
            if let Some(vote) = dispute
                .revealed_votes
                .get(i)
                .ok_or(ContractError::ErrInternalState)?
            {
                if vote == 0 {
                    votes_claimer += 1;
                } else if vote == 1 {
                    votes_defender += 1;
                } else {
                    return Err(ContractError::ErrInvalidVote);
                }
            }
        }

        let winner_vote = if votes_claimer > votes_defender { 0 } else { 1 };

        let mut correctness = Vec::new(&env);
        for i in 0..juror_count {
            let is_correct = match dispute
                .revealed_votes
                .get(i)
                .ok_or(ContractError::ErrInternalState)?
            {
                Some(v) if v == winner_vote => 1,
                _ => 0,
            };
            correctness.push_back(is_correct);
        }

        let mut total_slashed = 0i128;

        if winner_vote == 1 {
            total_slashed += dispute.claimer_amount;
        } else {
            total_slashed += dispute.defender_amount;
        }

        for i in 0..juror_count {
            if correctness.get(i).ok_or(ContractError::ErrInternalState)? == 0 {
                total_slashed += dispute
                    .juror_stakes
                    .get(i)
                    .ok_or(ContractError::ErrInternalState)?;
            }
        }

        let admin_fee = total_slashed * 5 / 100;
        let reward_pool = total_slashed - admin_fee;

        let mut correct_count = 0;
        for i in 0..juror_count {
            if correctness.get(i).ok_or(ContractError::ErrInternalState)? == 1 {
                correct_count += 1;
            }
        }

        let winners_total = correct_count + 1;
        let reward_each = if winners_total > 0 {
            reward_pool / (winners_total as i128)
        } else {
            0
        };

        let xlm_client = xlm::token_client(&env);
        let contract_addr = env.current_contract_address();
        let config = storage::get_config(&env)?;

        if admin_fee > 0 {
            let _ = xlm_client.try_transfer(&contract_addr, &config.admin, &admin_fee);
        }

        let winner = if winner_vote == 1 {
            dispute.defender.clone()
        } else {
            dispute.claimer.clone()
        };

        if reward_each > 0 {
            let _ = xlm_client.try_transfer(&contract_addr, &winner, &reward_each);

            for i in 0..juror_count {
                if correctness.get(i).ok_or(ContractError::ErrInternalState)? == 1 {
                    let juror = dispute
                        .assigned_jurors
                        .get(i)
                        .ok_or(ContractError::ErrInternalState)?;
                    let _ = xlm_client.try_transfer(&contract_addr, &juror, &reward_each);
                }
            }
        }

        dispute.status = DisputeStatus::Finished;
        dispute.winner = Some(winner.clone());
        storage::set_dispute(&env, &dispute);

        Ok(winner)
    }

    pub fn get_winner(env: Env, dispute_id: u64) -> Option<Address> {
        // Use storage helper but don't return Result in this view function
        let d = storage::get_dispute(&env, dispute_id).ok()?;
        if d.status != DisputeStatus::Finished {
            return None;
        }
        d.winner
    }

    pub fn get_dispute(env: Env, dispute_id: u64) -> Result<Dispute, ContractError> {
        storage::get_dispute(&env, dispute_id)
    }
}

fn require_admin(env: &Env) -> Result<(), ContractError> {
    let cfg = storage::get_config(env)?;
    cfg.admin.require_auth();
    Ok(())
}

fn compute_commitment(
    env: &Env,
    vote: u32,
    salt: &BytesN<32>,
) -> Result<BytesN<32>, ContractError> {
    if vote > 1 {
        return Err(ContractError::ErrInvalidVote);
    }

    let mut hasher = Sha256::new();
    hasher.update(&vote.to_be_bytes());
    hasher.update(&salt.to_array());
    let hash = hasher.finalize();

    let mut out = [0u8; 32];
    out.copy_from_slice(&hash[..32]);
    Ok(BytesN::from_array(env, &out))
}

fn maybe_start_reveal_phase(env: &Env, dispute: &mut Dispute) -> Result<(), ContractError> {
    if dispute.status != DisputeStatus::Commit {
        return Ok(());
    }

    let now = env.ledger().timestamp();

    let mut all_committed = true;
    for i in 0..dispute.commitments.len() {
        if dispute
            .commitments
            .get(i)
            .ok_or(ContractError::ErrInternalState)?
            .is_none()
        {
            all_committed = false;
            break;
        }
    }

    if now > dispute.deadline_commit_seconds || all_committed {
        dispute.status = DisputeStatus::Reveal;
    }
    Ok(())
}
