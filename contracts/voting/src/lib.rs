#![no_std]
extern crate alloc;

use alloc::vec::Vec as StdVec;
use core::str;
use soroban_sdk::{
    contract, contractimpl, symbol_short, Address, Bytes, BytesN, Env, Symbol,
};

mod ultrahonk_contract {
    soroban_sdk::contractimport!(file = "ultrahonk_soroban_contract.wasm");
}

mod error;

use error::Error;
use sha3::{Digest, Keccak256};

#[contract]
pub struct Voting;

// Storage keys
pub const ADMIN_KEY: &Symbol = &symbol_short!("ADMIN");
pub const NEXT_PROPOSAL_ID_KEY: &Symbol = &symbol_short!("NEXT_ID");
pub const ULTRAHONK_CONTRACT_ADDRESS: &str = "CAXMCB6EYJ6Z6PHHC3MZ54IKHAZV5WSM2OAK4DSGM2E2M6DJG4FX5CPB";

fn keccak32(data: &[u8]) -> [u8; 32] {
    let mut hasher = Keccak256::new();
    hasher.update(data);
    let digest = hasher.finalize();
    let mut out = [0u8; 32];
    out.copy_from_slice(&digest);
    out
}

#[contractimpl]
impl Voting {
    /// Constructor to initialize the contract with an admin
    pub fn __constructor(env: &Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(ADMIN_KEY, &admin);
    }

    /// Get current admin
    pub fn admin(env: &Env) -> Option<Address> {
        env.storage().instance().get(ADMIN_KEY)
    }

    /// Private helper function to require auth from the admin
    fn require_admin(env: &Env) {
        let admin = Self::admin(env).expect("admin not set");
        admin.require_auth();
    }


    /// Helper to create Symbol from bytes (for short keys)
    /// Converts first few bytes to a short symbol string
    fn bytes_to_symbol(env: &Env, bytes: &[u8]) -> Symbol {
        let hash = keccak32(bytes);
        // Convert first 4 bytes to hex string (8 chars max, symbol_short supports 9)
        let mut hex_chars = [0u8; 8];
        for i in 0..4 {
            let byte = hash[i];
            let high = (byte >> 4) & 0x0f;
            let low = byte & 0x0f;
            hex_chars[i * 2] = if high < 10 { b'0' + high } else { b'a' + high - 10 };
            hex_chars[i * 2 + 1] = if low < 10 { b'0' + low } else { b'a' + low - 10 };
        }
        // SAFETY: hex_chars is always valid UTF-8
        let hex_str = unsafe { core::str::from_utf8_unchecked(&hex_chars) };
        Symbol::new(env, hex_str)
    }

    /// Helper to create commitment key
    fn commitment_key(env: &Env, proposal_id: &u64, nullifier: &BytesN<32>) -> Symbol {
        let mut key_bytes = StdVec::new();
        key_bytes.push(0x01); // prefix for commitment
        key_bytes.extend_from_slice(&proposal_id.to_be_bytes());
        let nullifier_bytes: [u8; 32] = nullifier.to_array();
        key_bytes.extend_from_slice(&nullifier_bytes);
        Self::bytes_to_symbol(env, &key_bytes)
    }

    /// Helper to create nullifier key
    fn nullifier_key(env: &Env, nullifier: &BytesN<32>) -> Symbol {
        let mut key_bytes = StdVec::new();
        key_bytes.push(0x02); // prefix for nullifier
        let nullifier_bytes: [u8; 32] = nullifier.to_array();
        key_bytes.extend_from_slice(&nullifier_bytes);
        Self::bytes_to_symbol(env, &key_bytes)
    }

    /// Helper to create vote revealed key
    fn vote_revealed_key(env: &Env, proposal_id: &u64, nullifier: &BytesN<32>) -> Symbol {
        let mut key_bytes = StdVec::new();
        key_bytes.push(0x03); // prefix for revealed
        key_bytes.extend_from_slice(&proposal_id.to_be_bytes());
        let nullifier_bytes: [u8; 32] = nullifier.to_array();
        key_bytes.extend_from_slice(&nullifier_bytes);
        Self::bytes_to_symbol(env, &key_bytes)
    }

    /// Helper to create vote count key
    fn vote_count_key(env: &Env, proposal_id: &u64, vote: &u32) -> Symbol {
        let mut key_bytes = StdVec::new();
        key_bytes.push(0x04); // prefix for vote count
        key_bytes.extend_from_slice(&proposal_id.to_be_bytes());
        key_bytes.extend_from_slice(&vote.to_be_bytes());
        Self::bytes_to_symbol(env, &key_bytes)
    }

    /// Helper to create proposal description key
    fn proposal_desc_key(env: &Env, proposal_id: &u64) -> Symbol {
        let mut key_bytes = StdVec::new();
        key_bytes.push(0x10); // prefix for proposal desc
        key_bytes.extend_from_slice(&proposal_id.to_be_bytes());
        Self::bytes_to_symbol(env, &key_bytes)
    }

    /// Helper to create proposal deadline key
    fn proposal_deadline_key(env: &Env, proposal_id: &u64) -> Symbol {
        let mut key_bytes = StdVec::new();
        key_bytes.push(0x11); // prefix for proposal deadline
        key_bytes.extend_from_slice(&proposal_id.to_be_bytes());
        Self::bytes_to_symbol(env, &key_bytes)
    }

    /// Helper to create proposal creator key
    fn proposal_creator_key(env: &Env, proposal_id: &u64) -> Symbol {
        let mut key_bytes = StdVec::new();
        key_bytes.push(0x12); // prefix for proposal creator
        key_bytes.extend_from_slice(&proposal_id.to_be_bytes());
        Self::bytes_to_symbol(env, &key_bytes)
    }

    /// Create a new proposal
    /// Returns proposal_id
    pub fn create_proposal(
        env: Env,
        creator: Address,
        description: Bytes,
        deadline: u64,
    ) -> u64 {
        creator.require_auth();

        // Get next proposal ID (simple counter)
        let next_id: u64 = env
            .storage()
            .instance()
            .get(NEXT_PROPOSAL_ID_KEY)
            .unwrap_or(0);

        let proposal_id = next_id + 1;

        // Store proposal data
        let prop_desc_key = Self::proposal_desc_key(&env, &proposal_id);
        let prop_deadline_key = Self::proposal_deadline_key(&env, &proposal_id);
        let prop_creator_key = Self::proposal_creator_key(&env, &proposal_id);

        env.storage().instance().set(&prop_desc_key, &description);
        env.storage().instance().set(&prop_deadline_key, &deadline);
        env.storage().instance().set(&prop_creator_key, &creator);

        // Update next proposal ID
        env.storage().instance().set(NEXT_PROPOSAL_ID_KEY, &proposal_id);

        proposal_id
    }

    /// Get the last proposal ID (next proposal ID - 1)
    pub fn last_proposal_id(env: &Env) -> u64 {
        let next_id: u64 = env
            .storage()
            .instance()
            .get(NEXT_PROPOSAL_ID_KEY)
            .unwrap_or(0);
        if next_id > 0 {
            next_id - 1
        } else {
            0
        }
    }

    /// Get proposal details
    pub fn get_proposal(env: Env, proposal_id: u64) -> Option<(Bytes, u64, Address)> {
        let prop_desc_key = Self::proposal_desc_key(&env, &proposal_id);
        let prop_deadline_key = Self::proposal_deadline_key(&env, &proposal_id);
        let prop_creator_key = Self::proposal_creator_key(&env, &proposal_id);

        let description: Option<Bytes> = env.storage().instance().get(&prop_desc_key);
        let deadline: Option<u64> = env.storage().instance().get(&prop_deadline_key);
        let creator: Option<Address> = env.storage().instance().get(&prop_creator_key);

        if let (Some(desc), Some(dl), Some(cr)) = (description, deadline, creator) {
            Some((desc, dl, cr))
        } else {
            None
        }
    }

    /// Vote (commit phase): Submit a zero-knowledge proof of a vote commitment
    pub fn vote(
        env: Env,
        voter: Address,
        proposal_id: u64,
        commitment: BytesN<32>,
        nullifier: BytesN<32>,
        vk_json: Bytes,
        proof_blob: Bytes,
    ) -> Result<BytesN<32>, Error> {
        voter.require_auth();

        // Verify proposal exists and is not past deadline
        if let Some((_desc, deadline, _creator)) = Self::get_proposal(env.clone(), proposal_id) {
            let current_ledger = env.ledger().sequence();
            if u64::from(current_ledger) > deadline {
                return Err(Error::ProposalDeadlinePassed);
            }
        } else {
            return Err(Error::ProposalNotFound);
        }

        // Verify nullifier hasn't been used (prevent double voting)
        let nullifier_key_symbol = Self::nullifier_key(&env, &nullifier);
        if env.storage().instance().has(&nullifier_key_symbol) {
            return Err(Error::NullifierAlreadyUsed);
        }

        // Verify proof using ultrahonk contract
        let ultrahonk_contract_address =
            Address::from_str(&env, ULTRAHONK_CONTRACT_ADDRESS);
        let ultrahonk_client =
            ultrahonk_contract::Client::new(&env, &ultrahonk_contract_address);

        match ultrahonk_client.try_verify_proof(&vk_json, &proof_blob) {
            Ok(Ok(_proof_id)) => {
                // Proof is valid, store commitment and nullifier
                let commitment_key_symbol = Self::commitment_key(&env, &proposal_id, &nullifier);
                env.storage().instance().set(&commitment_key_symbol, &commitment);
                env.storage().instance().set(&nullifier_key_symbol, &true);

                Ok(nullifier)
            }
            _ => Err(Error::ProofVerificationFailed),
        }
    }

    /// Reveal vote: Reveal the vote and salt to verify commitment
    /// This is called after voting period ends
    pub fn reveal_vote(
        env: Env,
        voter: Address,
        proposal_id: u64,
        nullifier: BytesN<32>,
        vote: u32,
        salt: BytesN<32>,
    ) -> Result<(), Error> {
        voter.require_auth();

        // Validate vote is 0 or 1
        if vote > 1 {
            return Err(Error::InvalidVoteValue);
        }

        // Check if vote already revealed
        let revealed_key = Self::vote_revealed_key(&env, &proposal_id, &nullifier);
        if env.storage().instance().has(&revealed_key) {
            return Err(Error::VoteAlreadyRevealed);
        }

        // Get stored commitment
        let commitment_key_symbol = Self::commitment_key(&env, &proposal_id, &nullifier);
        let stored_commitment: Option<BytesN<32>> =
            env.storage().instance().get(&commitment_key_symbol);

        if stored_commitment.is_none() {
            return Err(Error::CommitmentNotFound);
        }

        // Verify commitment: compute hash(vote || salt) and compare
        let mut commitment_input = StdVec::new();
        commitment_input.extend_from_slice(&vote.to_be_bytes());
        let salt_bytes: [u8; 32] = salt.to_array();
        commitment_input.extend_from_slice(&salt_bytes);
        let computed_commitment_bytes = keccak32(&commitment_input);
        let computed_commitment = BytesN::from_array(&env, &computed_commitment_bytes);

        if computed_commitment != stored_commitment.unwrap() {
            return Err(Error::InvalidCommitment);
        }

        // Mark vote as revealed
        env.storage().instance().set(&revealed_key, &true);

        // Increment vote count
        let vote_count_key_symbol = Self::vote_count_key(&env, &proposal_id, &vote);
        let current_count: u64 = env
            .storage()
            .instance()
            .get(&vote_count_key_symbol)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&vote_count_key_symbol, &(current_count + 1));

        Ok(())
    }

    /// Get vote count for a specific vote option in a proposal
    pub fn get_vote_count(env: Env, proposal_id: u64, vote: u32) -> u64 {
        let vote_count_key_symbol = Self::vote_count_key(&env, &proposal_id, &vote);
        env.storage()
            .instance()
            .get(&vote_count_key_symbol)
            .unwrap_or(0)
    }

    /// Check if a nullifier has been used
    pub fn is_nullifier_used(env: Env, nullifier: BytesN<32>) -> bool {
        let nullifier_key_symbol = Self::nullifier_key(&env, &nullifier);
        env.storage().instance().has(&nullifier_key_symbol)
    }

    /// Check if a vote has been revealed
    pub fn is_vote_revealed(env: Env, proposal_id: u64, nullifier: BytesN<32>) -> bool {
        let revealed_key = Self::vote_revealed_key(&env, &proposal_id, &nullifier);
        env.storage().instance().has(&revealed_key)
    }
}
