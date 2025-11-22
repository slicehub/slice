#![no_std]

use sha2::{Digest, Sha256};
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Bytes, BytesN, Env, Symbol, Vec,
};

mod error;
use error::ContractError;

mod xlm;

mod ultrahonk_contract {
    soroban_sdk::contractimport!(file = "ultrahonk_soroban_contract.wasm");
}

#[contract]
pub struct Slice;

// ---------------------------------------------------------
// Dispute statuses
// ---------------------------------------------------------
const STATUS_CREATED: u32 = 0;
const STATUS_COMMIT: u32 = 1;
const STATUS_REVEAL: u32 = 2;
const STATUS_FINISHED: u32 = 3;

// Storage keys
pub const CATEGORIES_KEY: &Symbol = &symbol_short!("CATS");
pub const CONFIG_KEY: &Symbol = &symbol_short!("CONF");
pub const DISPUTE_COUNTER_KEY: &Symbol = &symbol_short!("CNTR");

// UltraHonk verifier contract address
pub const ULTRAHONK_CONTRACT_ADDRESS: &str =
    "CAXMCB6EYJ6Z6PHHC3MZ54IKHAZV5WSM2OAK4DSGM2E2M6DJG4FX5CPB";

// ---------------------------------------------------------
// Data Structures
// ---------------------------------------------------------
#[contracttype]
#[derive(Clone)]
pub struct Dispute {
    pub id: u64,

    // Parties
    pub claimer: Address,
    pub defender: Address,

    // Metadata hash provided off-chain
    pub meta_hash: BytesN<32>,

    // Amount bonding requirements
    pub min_amount: i128,
    pub max_amount: i128,

    // Category assignment
    pub category: Symbol,
    pub allowed_jurors: Option<Vec<Address>>,
    pub jurors_required: u32,

    // Absolute UNIX-style timestamps (ledger timestamps)
    pub deadline_pay_seconds: u64,
    pub deadline_commit_seconds: u64,
    pub deadline_reveal_seconds: u64,

    // Juror data
    pub assigned_jurors: Vec<Address>,
    pub juror_stakes: Vec<i128>,

    // Commit–reveal scheme
    pub commitments: Vec<Option<BytesN<32>>>,
    pub revealed_votes: Vec<Option<u32>>,
    pub revealed_salts: Vec<Option<BytesN<32>>>,

    // Status
    pub status: u32,

    // Payments
    pub claimer_paid: bool,
    pub defender_paid: bool,
    pub claimer_amount: i128,
    pub defender_amount: i128,

    // Final result
    pub winner: Option<Address>,
}

// Add this struct to group arguments and solve the "too many parameters" error
#[contracttype]
#[derive(Clone)]
pub struct TimeLimits {
    pub pay_seconds: u64,
    pub commit_seconds: u64,
    pub reveal_seconds: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct Categories {
    pub items: Vec<Symbol>,
}

// Global configuration set by admin
#[contracttype]
#[derive(Clone)]
pub struct Config {
    pub admin: Address,

    // Time constraints enforced globally
    pub min_pay_seconds: u64,
    pub max_pay_seconds: u64,

    pub min_commit_seconds: u64,
    pub max_commit_seconds: u64,

    pub min_reveal_seconds: u64,
    pub max_reveal_seconds: u64,
}

#[contractimpl]
impl Slice {
    // ---------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------
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
        // Only admin can deploy
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

        env.storage().instance().set(CONFIG_KEY, &config);

        // Initialize category list and dispute counter
        let categories = Categories {
            items: Vec::new(&env),
        };
        env.storage().instance().set(CATEGORIES_KEY, &categories);
        env.storage().instance().set(DISPUTE_COUNTER_KEY, &0u64);
    }

    // Utility getters
    fn get_config(env: &Env) -> Config {
        env.storage()
            .instance()
            .get(CONFIG_KEY)
            .expect("Config not initialized")
    }

    fn require_admin(env: &Env) {
        let cfg = Self::get_config(env);
        cfg.admin.require_auth();
    }

    fn get_categories(env: &Env) -> Categories {
        env.storage()
            .instance()
            .get(CATEGORIES_KEY)
            .unwrap_or(Categories {
                items: Vec::new(env),
            })
    }

    fn set_categories(env: &Env, cats: Categories) {
        env.storage().instance().set(CATEGORIES_KEY, &cats);
    }

    fn get_dispute_counter(env: &Env) -> u64 {
        env.storage()
            .instance()
            .get(DISPUTE_COUNTER_KEY)
            .unwrap_or(0u64)
    }

    fn increment_dispute_counter(env: &Env) -> u64 {
        let new = Self::get_dispute_counter(env) + 1;
        env.storage().instance().set(DISPUTE_COUNTER_KEY, &new);
        new
    }

    // Storage key for a specific dispute
    fn get_dispute_key(env: &Env, id: u64) -> BytesN<32> {
        let mut arr = [0u8; 32];
        arr[0..4].copy_from_slice(b"DISP");
        arr[4..12].copy_from_slice(&id.to_be_bytes());
        BytesN::from_array(env, &arr)
    }

    fn get_dispute_internal(env: &Env, id: u64) -> Option<Dispute> {
        env.storage()
            .instance()
            .get(&Self::get_dispute_key(env, id))
    }

    fn set_dispute(env: &Env, dispute: &Dispute) {
        env.storage()
            .instance()
            .set(&Self::get_dispute_key(env, dispute.id), dispute);
    }

    fn category_exists(env: &Env, cat: Symbol) -> bool {
        Self::get_categories(env).items.contains(&cat)
    }

    // ---------------------------------------------------------
    // Commit–Reveal Utility
    // ---------------------------------------------------------
    /// Computes H(vote || salt) using SHA256.
    /// Used to verify commit correctness before reveal.
    fn compute_commitment(env: &Env, vote: u32, salt: &BytesN<32>) -> BytesN<32> {
        if vote > 1 {
            panic!("invalid vote");
        }

        let mut hasher = Sha256::new();
        hasher.update(&vote.to_be_bytes());
        hasher.update(&salt.to_array());
        let hash = hasher.finalize();

        let mut out = [0u8; 32];
        out.copy_from_slice(&hash[..32]);
        BytesN::from_array(env, &out)
    }

    /// Forces transition from COMMIT → REVEAL if:
    /// - commit deadline passed, or
    /// - all jurors committed their commitments.
    fn maybe_start_reveal_phase(env: &Env, dispute: &mut Dispute) {
        if dispute.status != STATUS_COMMIT {
            return;
        }

        let now = env.ledger().timestamp();

        let mut all_committed = true;
        for i in 0..dispute.commitments.len() {
            if dispute.commitments.get(i).unwrap().is_none() {
                all_committed = false;
                break;
            }
        }

        if now > dispute.deadline_commit_seconds || all_committed {
            dispute.status = STATUS_REVEAL;
        }
    }

    // ---------------------------------------------------------
    // Category Management
    // ---------------------------------------------------------
    pub fn add_category(env: Env, name: Symbol) -> Result<(), ContractError> {
        Self::require_admin(&env);

        let mut cats = Self::get_categories(&env);
        if cats.items.contains(&name) {
            return Err(ContractError::ErrAlreadyExists);
        }

        cats.items.push_back(name);
        Self::set_categories(&env, cats);
        Ok(())
    }

    pub fn remove_category(env: Env, name: Symbol) -> Result<(), ContractError> {
        Self::require_admin(&env);

        let mut cats = Self::get_categories(&env);
        let mut found = false;
        let mut new_items = Vec::new(&env);

        for i in 0..cats.items.len() {
            let item = cats.items.get(i).unwrap();
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
        Self::set_categories(&env, cats);
        Ok(())
    }

    // ---------------------------------------------------------
    // create_dispute
    // ---------------------------------------------------------
    /// Creates a new dispute with predetermined deadlines for:
    /// - payment phase
    /// - commit phase
    /// - reveal phase
    ///
    /// The creator chooses the durations, but they must respect the global config bounds.
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
        if !Self::category_exists(&env, category.clone()) {
            return Err(ContractError::ErrCategoryNotFound);
        }

        if jurors_required < 5 || jurors_required > 101 || jurors_required % 2 == 0 {
            return Err(ContractError::ErrInvalidJurorCount);
        }

        if min_amount <= 0 || max_amount < min_amount {
            return Err(ContractError::ErrInvalidAmounts);
        }

        let cfg = Self::get_config(&env);

        // Validate pay phase
        if limits.pay_seconds < cfg.min_pay_seconds || limits.pay_seconds > cfg.max_pay_seconds {
            return Err(ContractError::ErrInvalidDeadline);
        }

        // Validate commit phase
        if limits.commit_seconds < cfg.min_commit_seconds
            || limits.commit_seconds > cfg.max_commit_seconds
        {
            return Err(ContractError::ErrInvalidDeadline);
        }

        // Validate reveal phase
        if limits.reveal_seconds < cfg.min_reveal_seconds
            || limits.reveal_seconds > cfg.max_reveal_seconds
        {
            return Err(ContractError::ErrInvalidDeadline);
        }

        // Must satisfy: pay ≤ commit ≤ reveal
        if !(limits.pay_seconds <= limits.commit_seconds
            && limits.commit_seconds <= limits.reveal_seconds)
        {
            return Err(ContractError::ErrInvalidDeadline);
        }

        let id = Self::increment_dispute_counter(&env);
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

            status: STATUS_CREATED,
            claimer_paid: false,
            defender_paid: false,
            claimer_amount: 0,
            defender_amount: 0,
            winner: None,
        };

        Self::set_dispute(&env, &dispute);
        Ok(id)
    }

    // ---------------------------------------------------------
    // pay_dispute
    // ---------------------------------------------------------
    /// Allows both parties to lock their stake in the dispute.
    /// Once both have paid, the dispute automatically enters COMMIT phase.
    pub fn pay_dispute(
        env: Env,
        caller: Address,
        dispute_id: u64,
        amount: i128,
    ) -> Result<(), ContractError> {
        caller.require_auth();

        let mut dispute =
            Self::get_dispute_internal(&env, dispute_id).ok_or(ContractError::ErrNotFound)?;

        if dispute.status != STATUS_CREATED {
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

        // When both have paid → move to COMMIT phase
        if dispute.claimer_paid && dispute.defender_paid {
            dispute.status = STATUS_COMMIT;
        }

        Self::set_dispute(&env, &dispute);
        Ok(())
    }

    // ---------------------------------------------------------
    // assign_dispute
    // ---------------------------------------------------------
    /// Jurors self-assign into disputes matching their category.
    /// They must provide a stake, and optionally be whitelisted.
    pub fn assign_dispute(
        env: Env,
        caller: Address,
        category: Symbol,
        stake_amount: i128,
    ) -> Result<(u64, Address), ContractError> {
        caller.require_auth();

        if !Self::category_exists(&env, category.clone()) {
            return Err(ContractError::ErrCategoryNotFound);
        }

        let mut eligible = Vec::new(&env);
        let count = Self::get_dispute_counter(&env);

        // Find disputes needing more jurors
        for i in 1..=count {
            if let Some(dispute) = Self::get_dispute_internal(&env, i) {
                if dispute.status == STATUS_COMMIT
                    && dispute.category == category
                    && (dispute.assigned_jurors.len() as u32) < dispute.jurors_required
                {
                    // If whitelist exists → must be included
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

        let dispute_id = eligible.get(0).unwrap();
        let mut dispute =
            Self::get_dispute_internal(&env, dispute_id).ok_or(ContractError::ErrNotFound)?;

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

        Self::set_dispute(&env, &dispute);
        Ok((dispute_id, caller))
    }

    // ---------------------------------------------------------
    // commit_vote
    // ---------------------------------------------------------
    /// Juror submits their commitment hash (H(vote || salt)).
    pub fn commit_vote(
        env: Env,
        caller: Address,
        dispute_id: u64,
        commitment: BytesN<32>,
    ) -> Result<(), ContractError> {
        caller.require_auth();

        let mut dispute =
            Self::get_dispute_internal(&env, dispute_id).ok_or(ContractError::ErrNotFound)?;

        if dispute.status != STATUS_COMMIT {
            return Err(ContractError::ErrVotingClosed);
        }

        if !dispute.assigned_jurors.contains(&caller) {
            return Err(ContractError::ErrNotJuror);
        }

        let now = env.ledger().timestamp();
        if now > dispute.deadline_commit_seconds {
            return Err(ContractError::ErrVotingClosed);
        }

        // Find juror index
        let idx = dispute
            .assigned_jurors
            .iter()
            .position(|addr| addr == caller)
            .ok_or(ContractError::ErrNotJuror)? as u32;

        if dispute.commitments.get(idx).unwrap().is_some() {
            return Err(ContractError::ErrAlreadyVoted);
        }

        dispute.commitments.set(idx, Some(commitment));

        // Auto-transition to REVEAL if all jurors committed
        let mut all_committed = true;
        for i in 0..dispute.commitments.len() {
            if dispute.commitments.get(i).unwrap().is_none() {
                all_committed = false;
                break;
            }
        }
        if all_committed {
            dispute.status = STATUS_REVEAL;
        }

        Self::set_dispute(&env, &dispute);
        Ok(())
    }

    // ---------------------------------------------------------
    // reveal_vote (ZK-verified)
    // ---------------------------------------------------------
    /// Juror reveals (vote, salt) + zk-proof.
    /// UltraHonk must confirm the proof is valid.
    pub fn reveal_vote(
        env: Env,
        caller: Address,
        dispute_id: u64,
        vote: u32,
        salt: BytesN<32>,

        // ZK inputs
        vk_json: Bytes,
        proof_blob: Bytes,
    ) -> Result<(), ContractError> {
        caller.require_auth();

        let mut dispute =
            Self::get_dispute_internal(&env, dispute_id).ok_or(ContractError::ErrNotFound)?;

        // Auto-transition if commit phase is over
        Self::maybe_start_reveal_phase(&env, &mut dispute);

        if dispute.status != STATUS_REVEAL {
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

        if dispute.revealed_votes.get(idx).unwrap().is_some() {
            return Err(ContractError::ErrAlreadyVoted);
        }

        let stored_commit = dispute
            .commitments
            .get(idx)
            .unwrap()
            .ok_or(ContractError::ErrInvalidProof)?;

        // -----------------------------------------
        // 1. Verify zk-proof using UltraHonk
        // -----------------------------------------
        let addr = Address::from_str(&env, ULTRAHONK_CONTRACT_ADDRESS);
        let client = ultrahonk_contract::Client::new(&env, &addr);

        match client.try_verify_proof(&vk_json, &proof_blob) {
            Ok(Ok(_)) => {} // Valid proof
            _ => return Err(ContractError::ErrInvalidProof),
        }

        // -----------------------------------------
        // 2. Verify commitment matches reveal
        // -----------------------------------------
        let computed = Self::compute_commitment(&env, vote, &salt);
        if computed != stored_commit {
            return Err(ContractError::ErrInvalidProof);
        }

        // -----------------------------------------
        // 3. Store revealed vote + salt
        // -----------------------------------------
        dispute.revealed_votes.set(idx, Some(vote));
        dispute.revealed_salts.set(idx, Some(salt));

        Self::set_dispute(&env, &dispute);
        Ok(())
    }

    // ---------------------------------------------------------
    // execute
    // ---------------------------------------------------------
    /// Finalizes the dispute:
    /// - checks majority
    /// - slashes incorrect jurors + losing party
    /// - distributes rewards to correct jurors and winner
    pub fn execute(env: Env, dispute_id: u64) -> Result<Address, ContractError> {
        let mut dispute =
            Self::get_dispute_internal(&env, dispute_id).ok_or(ContractError::ErrNotFound)?;

        // Auto-transition if necessary
        Self::maybe_start_reveal_phase(&env, &mut dispute);

        if dispute.status != STATUS_REVEAL {
            return Err(ContractError::ErrNotActive);
        }

        let now = env.ledger().timestamp();
        let juror_count = dispute.assigned_jurors.len();

        let mut all_revealed = true;
        for i in 0..juror_count {
            if dispute.revealed_votes.get(i).unwrap().is_none() {
                all_revealed = false;
                break;
            }
        }

        // If not all revealed, must wait for reveal deadline
        if !all_revealed && now <= dispute.deadline_reveal_seconds {
            return Err(ContractError::ErrRevealNotFinished);
        }

        // -------------------------------
        // Count votes
        // -------------------------------
        let mut votes_claimer = 0;
        let mut votes_defender = 0;

        for i in 0..juror_count {
            if let Some(vote) = dispute.revealed_votes.get(i).unwrap() {
                match vote {
                    0 => votes_claimer += 1,
                    1 => votes_defender += 1,
                    _ => return Err(ContractError::ErrInvalidVote),
                }
            }
        }

        let winner_vote = if votes_claimer > votes_defender { 0 } else { 1 };

        // Determine correct jurors
        let mut correctness = Vec::new(&env);
        for i in 0..juror_count {
            let mut ok = 0;
            if let Some(v) = dispute.revealed_votes.get(i).unwrap() {
                if v == winner_vote {
                    ok = 1;
                }
            }
            correctness.push_back(ok);
        }

        // -------------------------------
        // Slashing
        // -------------------------------
        let mut total_slashed = 0i128;

        if winner_vote == 1 {
            total_slashed += dispute.claimer_amount;
        } else {
            total_slashed += dispute.defender_amount;
        }

        for i in 0..juror_count {
            if correctness.get(i).unwrap() == 0 {
                total_slashed += dispute.juror_stakes.get(i).unwrap();
            }
        }

        let admin_fee = total_slashed * 5 / 100;
        let reward_pool = total_slashed - admin_fee;

        // Count correct jurors
        let mut correct_count = 0;
        for i in 0..juror_count {
            if correctness.get(i).unwrap() == 1 {
                correct_count += 1;
            }
        }

        // Winner + jurors_correct share reward
        let winners_total = correct_count + 1;
        let reward_each = if winners_total > 0 {
            reward_pool / (winners_total as i128)
        } else {
            0
        };

        // Transfers
        let xlm_client = xlm::token_client(&env);
        let contract_addr = env.current_contract_address();
        let config = Self::get_config(&env);

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
                if correctness.get(i).unwrap() == 1 {
                    let juror = dispute.assigned_jurors.get(i).unwrap();
                    let _ = xlm_client.try_transfer(&contract_addr, &juror, &reward_each);
                }
            }
        }

        dispute.status = STATUS_FINISHED;
        dispute.winner = Some(winner.clone());
        Self::set_dispute(&env, &dispute);

        Ok(winner)
    }

    // ---------------------------------------------------------
    // Getters
    // ---------------------------------------------------------
    pub fn get_winner(env: Env, dispute_id: u64) -> Option<Address> {
        let d = Self::get_dispute_internal(&env, dispute_id)?;
        if d.status != STATUS_FINISHED {
            return None;
        }
        d.winner
    }

    pub fn get_dispute(env: Env, dispute_id: u64) -> Result<Dispute, ContractError> {
        Self::get_dispute_internal(&env, dispute_id).ok_or(ContractError::ErrNotFound)
    }
}
