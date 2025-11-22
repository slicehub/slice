#[soroban_sdk::contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// Failed to verify proof
    ProofVerificationFailed = 1,
    /// Nullifier already used (double vote attempt)
    NullifierAlreadyUsed = 2,
    /// Proposal not found
    ProposalNotFound = 3,
    /// Proposal deadline has passed
    ProposalDeadlinePassed = 4,
    /// Commitment not found for reveal
    CommitmentNotFound = 5,
    /// Invalid commitment (doesn't match reveal)
    InvalidCommitment = 6,
    /// Vote already revealed
    VoteAlreadyRevealed = 7,
    /// Invalid vote value
    InvalidVoteValue = 8,
    /// Only admin can perform this action
    Unauthorized = 9,
}

