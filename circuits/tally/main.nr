use dep::std;

fn main(
    votes: [u32; 101],
    salts: [Field; 101],
    juror_count: pub u32,
    commitments: pub [Field; 101],
    dispute_id: pub u64,
    juror_addresses: pub [Field; 101],
    contract_commitments: pub [Field; 101],
    contract_jurors: pub [Field; 101],
) -> pub (u32, [u32; 101]) {
    assert(juror_count <= 101, "juror_count too large");
    assert(juror_count >= 5, "juror_count too small");
    assert(juror_count % 2 == 1, "juror_count must be odd");

    for i in 0..juror_count {
        assert(commitments[i] == contract_commitments[i], "commitment mismatch with contract");
        assert(juror_addresses[i] == contract_jurors[i], "juror address mismatch with contract");
    }

    for i in juror_count..101 {
        assert(contract_commitments[i] == 0, "unused contract_commitment slot must be 0");
        assert(contract_jurors[i] == 0, "unused contract_juror slot must be 0");
    }

    for i in juror_count..101 {
        assert(votes[i] == 0, "unused vote slot must be 0");
        assert(salts[i] == 0, "unused salt slot must be 0");
    }

    let mut vote_sum = 0u32;
    let mut juror_correctness: [u32; 101] = [0; 101];

    for i in 0..juror_count {
        let vote = votes[i];
        assert(vote == 0 || vote == 1, "vote must be 0 or 1");
        
        let salt = salts[i];
        let commitment = commitments[i];
        
        let vote_field = vote as Field;
        let hash_result = std::hash::pedersen_hash([vote_field, salt]);
        assert(hash_result == commitment, "commitment hash mismatch");
        
        vote_sum = vote_sum + vote;
    }

    let winner = if vote_sum > juror_count / 2 {
        1u32
    } else {
        0u32
    };

    for i in 0..juror_count {
        let vote = votes[i];
        juror_correctness[i] = if vote == winner { 1u32 } else { 0u32 };
    }

    for i in juror_count..101 {
        juror_correctness[i] = 0u32;
    }

    (winner, juror_correctness)
}

