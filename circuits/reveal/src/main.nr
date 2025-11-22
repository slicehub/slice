fn main(
    vote: u32,
) {
    assert((vote == 0) | (vote == 1));
}

#[test]
fn test_valid_vote_0() {
    main(0);
}

#[test]
fn test_valid_vote_1() {
    main(1);
}

#[test(should_fail)]
fn test_invalid_vote() {
    main(2);
}
