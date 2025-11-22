use dep::std;

fn main(
    vote: u32,
    salt: Field,
) -> pub Field {

    assert(vote == 0 || vote == 1, "vote must be 0 or 1");

    let vote_field = vote as Field;

    let commitment = std::hash::pedersen_hash([vote_field, salt]);

    commitment
}
