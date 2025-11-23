use soroban_sdk::{contracttype, symbol_short, Address, BytesN, Symbol, Vec};

#[contracttype]
#[derive(Clone, Copy, PartialEq)]
pub enum DisputeStatus {
    Created = 0,
    Commit = 1,
    Reveal = 2,
    Finished = 3,
}

// Storage keys
pub const CATEGORIES_KEY: &Symbol = &symbol_short!("CATS");
pub const CONFIG_KEY: &Symbol = &symbol_short!("CONF");
pub const DISPUTE_COUNTER_KEY: &Symbol = &symbol_short!("CNTR");

// UltraHonk verifier contract address
pub const ULTRAHONK_CONTRACT_ADDRESS: &str =
    "CAXMCB6EYJ6Z6PHHC3MZ54IKHAZV5WSM2OAK4DSGM2E2M6DJG4FX5CPB";

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

    pub deadline_pay_seconds: u64,
    pub deadline_commit_seconds: u64,
    pub deadline_reveal_seconds: u64,

    pub assigned_jurors: Vec<Address>,
    pub juror_stakes: Vec<i128>,

    pub commitments: Vec<Option<BytesN<32>>>,
    pub revealed_votes: Vec<Option<u32>>,
    pub revealed_salts: Vec<Option<BytesN<32>>>,

    pub status: DisputeStatus,

    pub claimer_paid: bool,
    pub defender_paid: bool,
    pub claimer_amount: i128,
    pub defender_amount: i128,

    pub winner: Option<Address>,
}

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

#[contracttype]
#[derive(Clone)]
pub struct Config {
    pub admin: Address,

    pub min_pay_seconds: u64,
    pub max_pay_seconds: u64,

    pub min_commit_seconds: u64,
    pub max_commit_seconds: u64,

    pub min_reveal_seconds: u64,
    pub max_reveal_seconds: u64,
}
