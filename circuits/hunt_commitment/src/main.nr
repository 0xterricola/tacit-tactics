use poseidon::poseidon2::Poseidon2;

global DOMAIN: Field = 0x544143495448554e545f5631;

fn board_commitment(
    challenge_id: u32,
    placement: u8,
    salt: Field
) -> Field {
    Poseidon2::hash([
        DOMAIN,
        challenge_id as Field,
        placement as Field,
        salt
    ], 4)
}


fn main(
    challenge_id: u32,
    placement: u8,
    salt: Field
) -> pub Field {
    assert(challenge_id != 0);
    assert(placement < 28);
    assert(salt != 0);

    board_commitment(
        challenge_id, placement, salt
    )
}
