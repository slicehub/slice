fn main(
    vote: u32,
    salt: Field,
) -> pub Field {
    // Assert vote is either 0 or 1
    assert((vote == 0) | (vote == 1));
    
    // Convert vote to Field
    let vote_field = vote as Field;
    
    // Compute Pedersen hash
    let commitment = std::hash::pedersen_hash([vote_field, salt]);
    
    commitment
}

#[test]
fn test_valid_vote_0() {
    let vote = 0;
    let salt = 12345;
    let commitment = main(vote, salt);
    assert(commitment != 0);
}

#[test]
fn test_valid_vote_1() {
    let vote = 1;
    let salt = 67890;
    let commitment = main(vote, salt);
    assert(commitment != 0);
}

#[test(should_fail)]
fn test_invalid_vote() {
    let vote = 2;  // Invalid: must be 0 or 1
    let salt = 11111;
    let _ = main(vote, salt);
}