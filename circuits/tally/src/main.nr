fn main(
    votes: [u32; 101],
    salts: [Field; 101],
    juror_count: pub u32,
    commitments: pub [Field; 101],
    _dispute_id: pub u64,
    juror_addresses: pub [Field; 101],
    contract_commitments: pub [Field; 101],
    contract_jurors: pub [Field; 101],
) -> pub (u32, [u32; 101]) {
    // Validate juror_count bounds
    assert(juror_count <= 101);
    assert(juror_count >= 5);
    assert(juror_count % 2 == 1);

    let mut vote_sum = 0;
    let mut juror_correctness: [u32; 101] = [0; 101];

    //
    // --- Verify commitments, jurors, votes, salts ---
    //
    for i in 0..101 {
        if i < juror_count {
            // Metadata must match contract
            assert(commitments[i] == contract_commitments[i]);
            assert(juror_addresses[i] == contract_jurors[i]);

            // Verify vote correctness
            let vote = votes[i];
            assert((vote == 0) | (vote == 1));

            let salt = salts[i];
            let commitment = commitments[i];
            let vote_field = vote as Field;

            let hash_result = std::hash::pedersen_hash([vote_field, salt]);
            assert(hash_result == commitment);

            vote_sum += vote;
        } else {
            // Unused slots MUST be zero
            assert(contract_commitments[i] == 0);
            assert(contract_jurors[i] == 0);
            assert(votes[i] == 0);
            assert(salts[i] == 0);
        }
    }

    //
    // --- Compute majority winner ---
    //
    let winner = if vote_sum > juror_count / 2 {
        1
    } else {
        0
    };

    //
    // --- Compute juror correctness ---
    //
    for i in 0..101 {
        if i < juror_count {
            let vote = votes[i];
            juror_correctness[i] = if vote == winner { 1 } else { 0 };
        } else {
            juror_correctness[i] = 0;
        }
    }

    (winner, juror_correctness)
}

//
// ------------------------
// ---- TESTS -------------
// ------------------------

#[test]
fn test_simple_majority() {
    let mut votes = [0; 101];
    let mut salts = [0; 101];
    let mut commitments = [0; 101];
    let mut juror_addresses = [0; 101];

    let juror_count = 5;

    votes[0] = 1;
    votes[1] = 1;
    votes[2] = 1;
    votes[3] = 0;
    votes[4] = 0;

    for i in 0..juror_count {
        salts[i] = (i + 1) as Field * 12345;
        let vote_field = votes[i] as Field;
        commitments[i] = std::hash::pedersen_hash([vote_field, salts[i]]);
        juror_addresses[i] = (i + 100) as Field;
    }

    let (winner, correctness) = main(
        votes,
        salts,
        juror_count,
        commitments,
        1,
        juror_addresses,
        commitments,
        juror_addresses,
    );

    assert(winner == 1);
    assert(correctness[0] == 1);
    assert(correctness[1] == 1);
    assert(correctness[2] == 1);
    assert(correctness[3] == 0);
    assert(correctness[4] == 0);
}

#[test(should_fail)]
fn test_invalid_vote_value() {
    let mut votes = [0; 101];
    let mut salts = [0; 101];
    let mut commitments = [0; 101];
    let mut juror_addresses = [0; 101];

    let juror_count = 5;

    votes[0] = 2; // invalid

    for i in 0..juror_count {
        salts[i] = (i + 1) as Field * 12345;
        let vote_field = votes[i] as Field;
        commitments[i] = std::hash::pedersen_hash([vote_field, salts[i]]);
        juror_addresses[i] = (i + 100) as Field;
    }

    let _ = main(
        votes,
        salts,
        juror_count,
        commitments,
        1,
        juror_addresses,
        commitments,
        juror_addresses,
    );
}

#[test(should_fail)]
fn test_commitment_mismatch() {
    let mut votes = [0; 101];
    let mut salts = [0; 101];
    let mut commitments = [0; 101];
    let mut juror_addresses = [0; 101];

    let juror_count = 5;

    for i in 0..juror_count {
        votes[i] = if i % 2 == 0 { 1 } else { 0 };
        salts[i] = (i + 1) as Field * 12345;
        let vote_field = votes[i] as Field;
        commitments[i] = std::hash::pedersen_hash([vote_field, salts[i]]);
        juror_addresses[i] = (i + 100) as Field;
    }

    commitments[2] = 999;

    let _ = main(
        votes,
        salts,
        juror_count,
        commitments,
        1,
        juror_addresses,
        commitments,
        juror_addresses,
    );
}
