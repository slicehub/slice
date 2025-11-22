#![no_std]
extern crate alloc;
use alloc::vec::Vec as StdVec;
use sha2::{Digest, Sha256};
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Bytes, BytesN, Env, Symbol, Vec};
use soroban_sdk::xdr::ToXdr;

mod error;
use error::ContractError;

mod xlm;

mod ultrahonk_contract {
    soroban_sdk::contractimport!(file = "../guess-the-puzzle/ultrahonk_soroban_contract.wasm");
}

#[contract]
pub struct Slice;

#[contracttype]
#[derive(Clone)]
pub struct Dispute {
    pub id: u64,
    pub claimer: Address,
    pub defender: Address,
    pub meta_hash: BytesN<32>,
    pub min_amount: i128,
    pub max_amount: i128,
    pub category: Symbol,
    pub allowed_jurors: Option<Vec<Address>>,
    pub jurors_required: u32,
    pub assigned_jurors: Vec<Address>,
    pub votes: Vec<Option<BytesN<32>>>,
    pub deadline_pay: u64,
    pub deadline_vote: u64,
    pub status: u32,
    pub claimer_paid: bool,
    pub defender_paid: bool,
    pub juror_stakes: Vec<i128>,
    pub claimer_amount: i128,
    pub defender_amount: i128,
    pub winner_address: Option<Address>,
}

#[contracttype]
#[derive(Clone)]
pub struct Categories {
    pub items: Vec<Symbol>,
}

#[contracttype]
#[derive(Clone)]
pub struct Config {
    pub admin: Address,
    pub min_vote_seconds: u64,
    pub max_vote_seconds: u64,
    pub min_deadline_seconds: u64,
    pub max_deadline_seconds: u64,
}

const CATEGORIES_KEY: &Symbol = &symbol_short!("CATS");
const CONFIG_KEY: &Symbol = &symbol_short!("CONF");
const DISPUTE_COUNTER_KEY: &Symbol = &symbol_short!("CNTR");
const ULTRAHONK_CONTRACT_ADDRESS: &str = "CAXMCB6EYJ6Z6PHHC3MZ54IKHAZV5WSM2OAK4DSGM2E2M6DJG4FX5CPB";

#[contractimpl]
impl Slice {
    pub fn __constructor(
        env: Env,
        admin: Address,
        min_vote_seconds: u64,
        max_vote_seconds: u64,
        min_deadline_seconds: u64,
        max_deadline_seconds: u64,
    ) {
        admin.require_auth();
        let config = Config {
            admin: admin.clone(),
            min_vote_seconds,
            max_vote_seconds,
            min_deadline_seconds,
            max_deadline_seconds,
        };
        env.storage().instance().set(CONFIG_KEY, &config);
        let categories = Categories {
            items: Vec::new(&env),
        };
        env.storage().instance().set(CATEGORIES_KEY, &categories);
        env.storage().instance().set(DISPUTE_COUNTER_KEY, &0u64);
    }

    fn get_config(env: &Env) -> Config {
        env.storage()
            .instance()
            .get(CONFIG_KEY)
            .expect("Config not initialized")
    }

    fn require_admin(env: &Env) {
        let config = Self::get_config(env);
        config.admin.require_auth();
    }

    fn get_categories(env: &Env) -> Categories {
        env.storage()
            .instance()
            .get(CATEGORIES_KEY)
            .unwrap_or(Categories {
                items: Vec::new(env),
            })
    }

    fn set_categories(env: &Env, categories: Categories) {
        env.storage().instance().set(CATEGORIES_KEY, &categories);
    }

    fn get_dispute_counter(env: &Env) -> u64 {
        env.storage()
            .instance()
            .get(DISPUTE_COUNTER_KEY)
            .unwrap_or(0u64)
    }

    fn increment_dispute_counter(env: &Env) -> u64 {
        let counter = Self::get_dispute_counter(env) + 1;
        env.storage().instance().set(DISPUTE_COUNTER_KEY, &counter);
        counter
    }

    fn get_dispute_key(env: &Env, dispute_id: u64) -> BytesN<32> {
        let mut key_bytes = [0u8; 32];
        key_bytes[0..4].copy_from_slice(b"DISP");
        let id_bytes = dispute_id.to_be_bytes();
        key_bytes[4..12].copy_from_slice(&id_bytes);
        BytesN::from_array(env, &key_bytes)
    }

    fn get_dispute_internal(env: &Env, dispute_id: u64) -> Option<Dispute> {
        let key = Self::get_dispute_key(env, dispute_id);
        env.storage().instance().get(&key)
    }

    fn set_dispute(env: &Env, dispute: &Dispute) {
        let key = Self::get_dispute_key(env, dispute.id);
        env.storage().instance().set(&key, dispute);
    }

    fn bytes32_to_field_bytes(bytes: &BytesN<32>) -> [u8; 32] {
        bytes.to_array()
    }

    fn address_to_field_bytes(env: &Env, address: &Address) -> [u8; 32] {
        let mut field_bytes = [0u8; 32];
        let address_val = address.to_val();
        let address_bytes = address_val.to_xdr(env);
        let address_vec = address_bytes.to_alloc_vec();
        let mut hasher = Sha256::new();
        hasher.update(&address_vec);
        let hash = hasher.finalize();
        field_bytes.copy_from_slice(&hash[0..32]);
        field_bytes
    }

    fn category_exists(env: &Env, category: Symbol) -> bool {
        let categories = Self::get_categories(env);
        categories.items.contains(&category)
    }

    pub fn add_category(env: Env, name: Symbol) -> Result<(), ContractError> {
        Self::require_admin(&env);
        let mut categories = Self::get_categories(&env);
        if categories.items.contains(&name) {
            return Err(ContractError::ErrAlreadyExists);
        }
        categories.items.push_back(name);
        Self::set_categories(&env, categories);
        Ok(())
    }

    pub fn remove_category(env: Env, name: Symbol) -> Result<(), ContractError> {
        Self::require_admin(&env);
        let mut categories = Self::get_categories(&env);
        let mut found = false;
        let mut new_items = Vec::new(&env);
        for i in 0..categories.items.len() {
            let item = categories.items.get(i).unwrap();
            if item != name {
                new_items.push_back(item);
            } else {
                found = true;
            }
        }
        if !found {
            return Err(ContractError::ErrNotFound);
        }
        categories.items = new_items;
        Self::set_categories(&env, categories);
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
        pay_deadline_seconds: u64,
        vote_deadline_seconds: u64,
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

        let config = Self::get_config(&env);
        if pay_deadline_seconds < config.min_deadline_seconds
            || pay_deadline_seconds > config.max_deadline_seconds
        {
            return Err(ContractError::ErrInvalidDeadline);
        }

        if vote_deadline_seconds < config.min_vote_seconds
            || vote_deadline_seconds > config.max_vote_seconds
        {
            return Err(ContractError::ErrInvalidDeadline);
        }

        let dispute_id = Self::increment_dispute_counter(&env);
        let current_time = env.ledger().timestamp();
        let deadline_pay = current_time + pay_deadline_seconds;
        let deadline_vote = current_time + vote_deadline_seconds;

        let dispute = Dispute {
            id: dispute_id,
            claimer: claimer.clone(),
            defender: defender.clone(),
            meta_hash,
            min_amount,
            max_amount,
            category,
            allowed_jurors,
            jurors_required,
            assigned_jurors: Vec::new(&env),
            votes: Vec::new(&env),
            deadline_pay,
            deadline_vote,
            status: 0,
            claimer_paid: false,
            defender_paid: false,
            juror_stakes: Vec::new(&env),
            claimer_amount: 0,
            defender_amount: 0,
            winner_address: None,
        };

        Self::set_dispute(&env, &dispute);
        Ok(dispute_id)
    }

    pub fn pay_dispute(env: Env, caller: Address, dispute_id: u64, amount: i128) -> Result<(), ContractError> {
        caller.require_auth();
        let mut dispute = Self::get_dispute_internal(&env, dispute_id)
            .ok_or(ContractError::ErrNotFound)?;

        if dispute.status != 0 {
            return Err(ContractError::ErrAlreadyPaid);
        }

        if caller != dispute.claimer && caller != dispute.defender {
            return Err(ContractError::ErrUnauthorized);
        }

        let current_time = env.ledger().timestamp();
        if current_time > dispute.deadline_pay {
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
        } else if caller == dispute.defender {
            if dispute.defender_paid {
                return Err(ContractError::ErrAlreadyPaid);
            }
            dispute.defender_paid = true;
            dispute.defender_amount = amount;
        } else {
            return Err(ContractError::ErrUnauthorized);
        }

        if dispute.claimer_paid && dispute.defender_paid {
            dispute.status = 1;
        }

        Self::set_dispute(&env, &dispute);
        Ok(())
    }

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

        let mut eligible_disputes = Vec::new(&env);
        let counter = Self::get_dispute_counter(&env);

        for i in 1..=counter {
            if let Some(dispute) = Self::get_dispute_internal(&env, i) {
                if dispute.status == 1
                    && dispute.category == category
                    && (dispute.assigned_jurors.len() as u32) < dispute.jurors_required
                {
                    if let Some(ref allowed) = dispute.allowed_jurors {
                        if allowed.contains(&caller) {
                            eligible_disputes.push_back(i);
                        }
                    } else {
                        eligible_disputes.push_back(i);
                    }
                }
            }
        }

        if eligible_disputes.is_empty() {
            return Err(ContractError::ErrNoAvailableDisputes);
        }

        let dispute_id = eligible_disputes.get(0).unwrap();
        let mut dispute = Self::get_dispute_internal(&env, dispute_id)
            .ok_or(ContractError::ErrNotFound)?;

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
        dispute.votes.push_back(None);
        dispute.juror_stakes.push_back(stake_amount);

        Self::set_dispute(&env, &dispute);
        Ok((dispute_id, caller))
    }

    pub fn submit_vote(
        env: Env,
        caller: Address,
        dispute_id: u64,
        proof: Bytes,
        public_inputs: Bytes,
    ) -> Result<(), ContractError> {
        caller.require_auth();
        let mut dispute = Self::get_dispute_internal(&env, dispute_id)
            .ok_or(ContractError::ErrNotFound)?;

        if dispute.status != 1 {
            return Err(ContractError::ErrVotingClosed);
        }

        if !dispute.assigned_jurors.contains(&caller) {
            return Err(ContractError::ErrNotJuror);
        }

        let mut juror_index = None;
        for i in 0..dispute.assigned_jurors.len() {
            if dispute.assigned_jurors.get(i).unwrap() == caller {
                juror_index = Some(i);
                break;
            }
        }
        let juror_index = juror_index.ok_or(ContractError::ErrNotJuror)?;

        if juror_index >= dispute.votes.len() {
            return Err(ContractError::ErrNotJuror);
        }

        if dispute.votes.get(juror_index).unwrap().is_some() {
            return Err(ContractError::ErrAlreadyVoted);
        }

        let current_time = env.ledger().timestamp();
        if current_time > dispute.deadline_vote {
            return Err(ContractError::ErrVotingClosed);
        }

        let ultrahonk_contract_address = Address::from_str(&env, ULTRAHONK_CONTRACT_ADDRESS);
        let ultrahonk_client = ultrahonk_contract::Client::new(&env, &ultrahonk_contract_address);

        let vk_json = Bytes::from_slice(&env, &[]);
        match ultrahonk_client.try_verify_proof(&vk_json, &proof) {
            Ok(Ok(_proof_id)) => {
                let pub_inputs_vec = public_inputs.to_alloc_vec();
                if pub_inputs_vec.len() < 32 {
                    return Err(ContractError::ErrInvalidProof);
                }
                let mut commitment_bytes = [0u8; 32];
                commitment_bytes.copy_from_slice(&pub_inputs_vec[0..32]);
                let vote_commitment = BytesN::from_array(&env, &commitment_bytes);

                dispute.votes.set(juror_index, Some(vote_commitment));
                Self::set_dispute(&env, &dispute);
                Ok(())
            }
            _ => Err(ContractError::ErrInvalidProof),
        }
    }

    pub fn execute(
        env: Env,
        dispute_id: u64,
        tally_proof: Bytes,
        tally_public_inputs: Bytes,
    ) -> Result<Address, ContractError> {
        let mut dispute = Self::get_dispute_internal(&env, dispute_id)
            .ok_or(ContractError::ErrNotFound)?;

        if dispute.status != 1 {
            return Err(ContractError::ErrNotActive);
        }

        if dispute.status == 2 {
            return Err(ContractError::ErrAlreadyFinished);
        }

        let ultrahonk_contract_address = Address::from_str(&env, ULTRAHONK_CONTRACT_ADDRESS);
        let ultrahonk_client = ultrahonk_contract::Client::new(&env, &ultrahonk_contract_address);

        let vk_json = Bytes::from_slice(&env, &[]);
        match ultrahonk_client.try_verify_proof(&vk_json, &tally_proof) {
            Ok(Ok(_proof_id)) => {}
            _ => return Err(ContractError::ErrInvalidProof),
        }

        let pub_inputs_vec = tally_public_inputs.to_alloc_vec();
        
        let juror_count = dispute.assigned_jurors.len();
        let required_fields = 1u32 + (juror_count as u32) * 3u32;
        let required_len = (required_fields * 32u32) as usize;
        
        if pub_inputs_vec.len() < required_len {
            return Err(ContractError::ErrInvalidProof);
        }

        let winner_field_offset = 0usize;
        if winner_field_offset + 31 >= pub_inputs_vec.len() {
            return Err(ContractError::ErrInvalidProof);
        }
        let winner = u32::from_be_bytes([
            pub_inputs_vec[winner_field_offset + 28],
            pub_inputs_vec[winner_field_offset + 29],
            pub_inputs_vec[winner_field_offset + 30],
            pub_inputs_vec[winner_field_offset + 31],
        ]);

        if winner > 1 {
            return Err(ContractError::ErrInvalidProof);
        }

        let mut juror_correctness = Vec::new(&env);
        for i in 0..juror_count {
            let field_offset = ((1u32 + i as u32) * 32u32) as usize;
            if field_offset + 31 >= pub_inputs_vec.len() {
                return Err(ContractError::ErrInvalidProof);
            }
            let correctness = u32::from_be_bytes([
                pub_inputs_vec[field_offset + 28],
                pub_inputs_vec[field_offset + 29],
                pub_inputs_vec[field_offset + 30],
                pub_inputs_vec[field_offset + 31],
            ]);
            if correctness > 1 {
                return Err(ContractError::ErrInvalidProof);
            }
            juror_correctness.push_back(correctness);
        }

        let commitments_start = ((1u32 + juror_count as u32) * 32u32) as usize;
        for i in 0..juror_count {
            let field_offset = commitments_start + (i as usize * 32);
            if field_offset + 31 >= pub_inputs_vec.len() {
                return Err(ContractError::ErrInvalidProof);
            }
            let contract_commitment_bytes = Self::bytes32_to_field_bytes(
                &dispute.votes.get(i).unwrap().ok_or(ContractError::ErrInvalidProof)?
            );
            let proof_commitment = &pub_inputs_vec[field_offset..field_offset + 32];
            if contract_commitment_bytes != proof_commitment {
                return Err(ContractError::ErrInvalidProof);
            }
        }

        let jurors_start = commitments_start + (juror_count as usize * 32);
        for i in 0..juror_count {
            let field_offset = jurors_start + (i as usize * 32);
            if field_offset + 31 >= pub_inputs_vec.len() {
                return Err(ContractError::ErrInvalidProof);
            }
            let contract_juror_bytes = Self::address_to_field_bytes(&env, &dispute.assigned_jurors.get(i).unwrap());
            let mut proof_juror = [0u8; 32];
            proof_juror.copy_from_slice(&pub_inputs_vec[field_offset..field_offset + 32]);
            if contract_juror_bytes != proof_juror {
                return Err(ContractError::ErrInvalidProof);
            }
        }


        let mut total_slashed = 0i128;

        if winner == 1 {
            total_slashed += dispute.defender_amount;
        } else {
            total_slashed += dispute.claimer_amount;
        }

        for i in 0..juror_count {
            if juror_correctness.get(i).unwrap() == 0 {
                total_slashed += dispute.juror_stakes.get(i).unwrap();
            }
        }

        let admin_fee = total_slashed * 5 / 100;
        let reward_pool = total_slashed - admin_fee;

        let mut jurors_correct = 0u32;
        for i in 0..juror_count {
            if juror_correctness.get(i).unwrap() == 1 {
                jurors_correct += 1;
            }
        }

        let winners_count = jurors_correct + 1;
        let reward_per_winner = if winners_count > 0 {
            reward_pool / (winners_count as i128)
        } else {
            0
        };

        let xlm_client = xlm::token_client(&env);
        let contract_address = env.current_contract_address();
        let config = Self::get_config(&env);

        if admin_fee > 0 {
            let _ = xlm_client.try_transfer(&contract_address, &config.admin, &admin_fee);
        }

        let winner_address = if winner == 1 {
            dispute.claimer.clone()
        } else {
            dispute.defender.clone()
        };

        if reward_per_winner > 0 {
            let _ = xlm_client.try_transfer(&contract_address, &winner_address, &reward_per_winner);

            for i in 0..juror_count {
                if juror_correctness.get(i).unwrap() == 1 {
                    let juror = dispute.assigned_jurors.get(i).unwrap();
                    let _ = xlm_client.try_transfer(&contract_address, &juror, &reward_per_winner);
                }
            }
        }

        dispute.status = 2;
        dispute.winner_address = Some(winner_address.clone());
        Self::set_dispute(&env, &dispute);

        Ok(winner_address)
    }

    pub fn get_winner(env: Env, dispute_id: u64) -> Option<Address> {
        let dispute = Self::get_dispute_internal(&env, dispute_id)?;
        if dispute.status != 2 {
            return None;
        }
        dispute.winner_address
    }

    pub fn get_dispute(env: Env, dispute_id: u64) -> Result<Dispute, ContractError> {
        Self::get_dispute_internal(&env, dispute_id).ok_or(ContractError::ErrNotFound)
    }
}

