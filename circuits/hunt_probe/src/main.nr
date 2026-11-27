use poseidon::poseidon2::Poseidon2;

// Public protocol domain: TACITHUNT_V1
global DOMAIN: Field = 0x544143495448554e545f5631;

// Placement IDs follow the game engine's canonical order.
global LEGAL: [[u8; 4]; 28] = [
    [0, 1, 2, 3],
    [0, 5, 10, 15],
    [0, 6, 12, 18],
    [1, 2, 3, 4],
    [1, 6, 11, 16],
    [1, 7, 13, 19],
    [2, 7, 12, 17],
    [3, 8, 13, 18],
    [3, 7, 11, 15],
    [4, 9, 14, 19],
    [4, 8, 12, 16],
    [5, 6, 7, 8],
    [5, 10, 15, 20],
    [5, 11, 17, 23],
    [6, 7, 8, 9],
    [6, 11, 16, 21],
    [6, 12, 18, 24],
    [7, 12, 17, 22],
    [8, 13, 18, 23],
    [8, 12, 16, 20],
    [9, 14, 19, 24],
    [9, 13, 17, 21],
    [10, 11, 12, 13],
    [11, 12, 13, 14],
    [15, 16, 17, 18],
    [16, 17, 18, 19],
    [20, 21, 22, 23],
    [21, 22, 23, 24]
];

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

fn is_hit(placement: u8, square: u8) -> bool {
    assert(placement < 28, "Invalid placement");

    let board = LEGAL[placement as u32];

    (square == board[0]) |
    (square == board[1]) |
    (square == board[2]) |
    (square == board[3])
}

fn main(
    challenge_id: pub u32,
    commitment: pub Field,
    square: pub u8,
    hit: pub bool,
    placement: u8,
    salt: Field
) {
    assert(challenge_id != 0, "Invalid challenge ID");
    assert(placement < 28, "Invalid placement");
    assert(salt != 0, "Invalid salt");
    assert(square <= 25, "Invalid square");

    assert(
        board_commitment(
            challenge_id, placement, salt
        ) == commitment,
        "Commitment mismatch"
    );

    // Square 25 is reserved for board registration.
    // It is not a playable square.
    assert(
        is_hit(placement, square) == hit,
        "Incorrect probe response"
    );
}

// BEGIN GENERATED TESTS

#[test]
fn test_placement_0() {
    assert(is_hit(0, 0) == true);
    assert(is_hit(0, 1) == true);
    assert(is_hit(0, 2) == true);
    assert(is_hit(0, 3) == true);
    assert(is_hit(0, 4) == false);
    assert(is_hit(0, 5) == false);
    assert(is_hit(0, 6) == false);
    assert(is_hit(0, 7) == false);
    assert(is_hit(0, 8) == false);
    assert(is_hit(0, 9) == false);
    assert(is_hit(0, 10) == false);
    assert(is_hit(0, 11) == false);
    assert(is_hit(0, 12) == false);
    assert(is_hit(0, 13) == false);
    assert(is_hit(0, 14) == false);
    assert(is_hit(0, 15) == false);
    assert(is_hit(0, 16) == false);
    assert(is_hit(0, 17) == false);
    assert(is_hit(0, 18) == false);
    assert(is_hit(0, 19) == false);
    assert(is_hit(0, 20) == false);
    assert(is_hit(0, 21) == false);
    assert(is_hit(0, 22) == false);
    assert(is_hit(0, 23) == false);
    assert(is_hit(0, 24) == false);
    let c = board_commitment(1, 0, 123456);
    main(1, c, 0, true, 0, 123456);
    main(1, c, 4, false, 0, 123456);
    main(1, c, 25, false, 0, 123456);
}


#[test]
fn test_placement_1() {
    assert(is_hit(1, 0) == true);
    assert(is_hit(1, 1) == false);
    assert(is_hit(1, 2) == false);
    assert(is_hit(1, 3) == false);
    assert(is_hit(1, 4) == false);
    assert(is_hit(1, 5) == true);
    assert(is_hit(1, 6) == false);
    assert(is_hit(1, 7) == false);
    assert(is_hit(1, 8) == false);
    assert(is_hit(1, 9) == false);
    assert(is_hit(1, 10) == true);
    assert(is_hit(1, 11) == false);
    assert(is_hit(1, 12) == false);
    assert(is_hit(1, 13) == false);
    assert(is_hit(1, 14) == false);
    assert(is_hit(1, 15) == true);
    assert(is_hit(1, 16) == false);
    assert(is_hit(1, 17) == false);
    assert(is_hit(1, 18) == false);
    assert(is_hit(1, 19) == false);
    assert(is_hit(1, 20) == false);
    assert(is_hit(1, 21) == false);
    assert(is_hit(1, 22) == false);
    assert(is_hit(1, 23) == false);
    assert(is_hit(1, 24) == false);
    let c = board_commitment(1, 1, 123456);
    main(1, c, 0, true, 1, 123456);
    main(1, c, 1, false, 1, 123456);
    main(1, c, 25, false, 1, 123456);
}


#[test]
fn test_placement_2() {
    assert(is_hit(2, 0) == true);
    assert(is_hit(2, 1) == false);
    assert(is_hit(2, 2) == false);
    assert(is_hit(2, 3) == false);
    assert(is_hit(2, 4) == false);
    assert(is_hit(2, 5) == false);
    assert(is_hit(2, 6) == true);
    assert(is_hit(2, 7) == false);
    assert(is_hit(2, 8) == false);
    assert(is_hit(2, 9) == false);
    assert(is_hit(2, 10) == false);
    assert(is_hit(2, 11) == false);
    assert(is_hit(2, 12) == true);
    assert(is_hit(2, 13) == false);
    assert(is_hit(2, 14) == false);
    assert(is_hit(2, 15) == false);
    assert(is_hit(2, 16) == false);
    assert(is_hit(2, 17) == false);
    assert(is_hit(2, 18) == true);
    assert(is_hit(2, 19) == false);
    assert(is_hit(2, 20) == false);
    assert(is_hit(2, 21) == false);
    assert(is_hit(2, 22) == false);
    assert(is_hit(2, 23) == false);
    assert(is_hit(2, 24) == false);
    let c = board_commitment(1, 2, 123456);
    main(1, c, 0, true, 2, 123456);
    main(1, c, 1, false, 2, 123456);
    main(1, c, 25, false, 2, 123456);
}


#[test]
fn test_placement_3() {
    assert(is_hit(3, 0) == false);
    assert(is_hit(3, 1) == true);
    assert(is_hit(3, 2) == true);
    assert(is_hit(3, 3) == true);
    assert(is_hit(3, 4) == true);
    assert(is_hit(3, 5) == false);
    assert(is_hit(3, 6) == false);
    assert(is_hit(3, 7) == false);
    assert(is_hit(3, 8) == false);
    assert(is_hit(3, 9) == false);
    assert(is_hit(3, 10) == false);
    assert(is_hit(3, 11) == false);
    assert(is_hit(3, 12) == false);
    assert(is_hit(3, 13) == false);
    assert(is_hit(3, 14) == false);
    assert(is_hit(3, 15) == false);
    assert(is_hit(3, 16) == false);
    assert(is_hit(3, 17) == false);
    assert(is_hit(3, 18) == false);
    assert(is_hit(3, 19) == false);
    assert(is_hit(3, 20) == false);
    assert(is_hit(3, 21) == false);
    assert(is_hit(3, 22) == false);
    assert(is_hit(3, 23) == false);
    assert(is_hit(3, 24) == false);
    let c = board_commitment(1, 3, 123456);
    main(1, c, 1, true, 3, 123456);
    main(1, c, 0, false, 3, 123456);
    main(1, c, 25, false, 3, 123456);
}


#[test]
fn test_placement_4() {
    assert(is_hit(4, 0) == false);
    assert(is_hit(4, 1) == true);
    assert(is_hit(4, 2) == false);
    assert(is_hit(4, 3) == false);
    assert(is_hit(4, 4) == false);
    assert(is_hit(4, 5) == false);
    assert(is_hit(4, 6) == true);
    assert(is_hit(4, 7) == false);
    assert(is_hit(4, 8) == false);
    assert(is_hit(4, 9) == false);
    assert(is_hit(4, 10) == false);
    assert(is_hit(4, 11) == true);
    assert(is_hit(4, 12) == false);
    assert(is_hit(4, 13) == false);
    assert(is_hit(4, 14) == false);
    assert(is_hit(4, 15) == false);
    assert(is_hit(4, 16) == true);
    assert(is_hit(4, 17) == false);
    assert(is_hit(4, 18) == false);
    assert(is_hit(4, 19) == false);
    assert(is_hit(4, 20) == false);
    assert(is_hit(4, 21) == false);
    assert(is_hit(4, 22) == false);
    assert(is_hit(4, 23) == false);
    assert(is_hit(4, 24) == false);
    let c = board_commitment(1, 4, 123456);
    main(1, c, 1, true, 4, 123456);
    main(1, c, 0, false, 4, 123456);
    main(1, c, 25, false, 4, 123456);
}


#[test]
fn test_placement_5() {
    assert(is_hit(5, 0) == false);
    assert(is_hit(5, 1) == true);
    assert(is_hit(5, 2) == false);
    assert(is_hit(5, 3) == false);
    assert(is_hit(5, 4) == false);
    assert(is_hit(5, 5) == false);
    assert(is_hit(5, 6) == false);
    assert(is_hit(5, 7) == true);
    assert(is_hit(5, 8) == false);
    assert(is_hit(5, 9) == false);
    assert(is_hit(5, 10) == false);
    assert(is_hit(5, 11) == false);
    assert(is_hit(5, 12) == false);
    assert(is_hit(5, 13) == true);
    assert(is_hit(5, 14) == false);
    assert(is_hit(5, 15) == false);
    assert(is_hit(5, 16) == false);
    assert(is_hit(5, 17) == false);
    assert(is_hit(5, 18) == false);
    assert(is_hit(5, 19) == true);
    assert(is_hit(5, 20) == false);
    assert(is_hit(5, 21) == false);
    assert(is_hit(5, 22) == false);
    assert(is_hit(5, 23) == false);
    assert(is_hit(5, 24) == false);
    let c = board_commitment(1, 5, 123456);
    main(1, c, 1, true, 5, 123456);
    main(1, c, 0, false, 5, 123456);
    main(1, c, 25, false, 5, 123456);
}


#[test]
fn test_placement_6() {
    assert(is_hit(6, 0) == false);
    assert(is_hit(6, 1) == false);
    assert(is_hit(6, 2) == true);
    assert(is_hit(6, 3) == false);
    assert(is_hit(6, 4) == false);
    assert(is_hit(6, 5) == false);
    assert(is_hit(6, 6) == false);
    assert(is_hit(6, 7) == true);
    assert(is_hit(6, 8) == false);
    assert(is_hit(6, 9) == false);
    assert(is_hit(6, 10) == false);
    assert(is_hit(6, 11) == false);
    assert(is_hit(6, 12) == true);
    assert(is_hit(6, 13) == false);
    assert(is_hit(6, 14) == false);
    assert(is_hit(6, 15) == false);
    assert(is_hit(6, 16) == false);
    assert(is_hit(6, 17) == true);
    assert(is_hit(6, 18) == false);
    assert(is_hit(6, 19) == false);
    assert(is_hit(6, 20) == false);
    assert(is_hit(6, 21) == false);
    assert(is_hit(6, 22) == false);
    assert(is_hit(6, 23) == false);
    assert(is_hit(6, 24) == false);
    let c = board_commitment(1, 6, 123456);
    main(1, c, 2, true, 6, 123456);
    main(1, c, 0, false, 6, 123456);
    main(1, c, 25, false, 6, 123456);
}


#[test]
fn test_placement_7() {
    assert(is_hit(7, 0) == false);
    assert(is_hit(7, 1) == false);
    assert(is_hit(7, 2) == false);
    assert(is_hit(7, 3) == true);
    assert(is_hit(7, 4) == false);
    assert(is_hit(7, 5) == false);
    assert(is_hit(7, 6) == false);
    assert(is_hit(7, 7) == false);
    assert(is_hit(7, 8) == true);
    assert(is_hit(7, 9) == false);
    assert(is_hit(7, 10) == false);
    assert(is_hit(7, 11) == false);
    assert(is_hit(7, 12) == false);
    assert(is_hit(7, 13) == true);
    assert(is_hit(7, 14) == false);
    assert(is_hit(7, 15) == false);
    assert(is_hit(7, 16) == false);
    assert(is_hit(7, 17) == false);
    assert(is_hit(7, 18) == true);
    assert(is_hit(7, 19) == false);
    assert(is_hit(7, 20) == false);
    assert(is_hit(7, 21) == false);
    assert(is_hit(7, 22) == false);
    assert(is_hit(7, 23) == false);
    assert(is_hit(7, 24) == false);
    let c = board_commitment(1, 7, 123456);
    main(1, c, 3, true, 7, 123456);
    main(1, c, 0, false, 7, 123456);
    main(1, c, 25, false, 7, 123456);
}


#[test]
fn test_placement_8() {
    assert(is_hit(8, 0) == false);
    assert(is_hit(8, 1) == false);
    assert(is_hit(8, 2) == false);
    assert(is_hit(8, 3) == true);
    assert(is_hit(8, 4) == false);
    assert(is_hit(8, 5) == false);
    assert(is_hit(8, 6) == false);
    assert(is_hit(8, 7) == true);
    assert(is_hit(8, 8) == false);
    assert(is_hit(8, 9) == false);
    assert(is_hit(8, 10) == false);
    assert(is_hit(8, 11) == true);
    assert(is_hit(8, 12) == false);
    assert(is_hit(8, 13) == false);
    assert(is_hit(8, 14) == false);
    assert(is_hit(8, 15) == true);
    assert(is_hit(8, 16) == false);
    assert(is_hit(8, 17) == false);
    assert(is_hit(8, 18) == false);
    assert(is_hit(8, 19) == false);
    assert(is_hit(8, 20) == false);
    assert(is_hit(8, 21) == false);
    assert(is_hit(8, 22) == false);
    assert(is_hit(8, 23) == false);
    assert(is_hit(8, 24) == false);
    let c = board_commitment(1, 8, 123456);
    main(1, c, 3, true, 8, 123456);
    main(1, c, 0, false, 8, 123456);
    main(1, c, 25, false, 8, 123456);
}


#[test]
fn test_placement_9() {
    assert(is_hit(9, 0) == false);
    assert(is_hit(9, 1) == false);
    assert(is_hit(9, 2) == false);
    assert(is_hit(9, 3) == false);
    assert(is_hit(9, 4) == true);
    assert(is_hit(9, 5) == false);
    assert(is_hit(9, 6) == false);
    assert(is_hit(9, 7) == false);
    assert(is_hit(9, 8) == false);
    assert(is_hit(9, 9) == true);
    assert(is_hit(9, 10) == false);
    assert(is_hit(9, 11) == false);
    assert(is_hit(9, 12) == false);
    assert(is_hit(9, 13) == false);
    assert(is_hit(9, 14) == true);
    assert(is_hit(9, 15) == false);
    assert(is_hit(9, 16) == false);
    assert(is_hit(9, 17) == false);
    assert(is_hit(9, 18) == false);
    assert(is_hit(9, 19) == true);
    assert(is_hit(9, 20) == false);
    assert(is_hit(9, 21) == false);
    assert(is_hit(9, 22) == false);
    assert(is_hit(9, 23) == false);
    assert(is_hit(9, 24) == false);
    let c = board_commitment(1, 9, 123456);
    main(1, c, 4, true, 9, 123456);
    main(1, c, 0, false, 9, 123456);
    main(1, c, 25, false, 9, 123456);
}


#[test]
fn test_placement_10() {
    assert(is_hit(10, 0) == false);
    assert(is_hit(10, 1) == false);
    assert(is_hit(10, 2) == false);
    assert(is_hit(10, 3) == false);
    assert(is_hit(10, 4) == true);
    assert(is_hit(10, 5) == false);
    assert(is_hit(10, 6) == false);
    assert(is_hit(10, 7) == false);
    assert(is_hit(10, 8) == true);
    assert(is_hit(10, 9) == false);
    assert(is_hit(10, 10) == false);
    assert(is_hit(10, 11) == false);
    assert(is_hit(10, 12) == true);
    assert(is_hit(10, 13) == false);
    assert(is_hit(10, 14) == false);
    assert(is_hit(10, 15) == false);
    assert(is_hit(10, 16) == true);
    assert(is_hit(10, 17) == false);
    assert(is_hit(10, 18) == false);
    assert(is_hit(10, 19) == false);
    assert(is_hit(10, 20) == false);
    assert(is_hit(10, 21) == false);
    assert(is_hit(10, 22) == false);
    assert(is_hit(10, 23) == false);
    assert(is_hit(10, 24) == false);
    let c = board_commitment(1, 10, 123456);
    main(1, c, 4, true, 10, 123456);
    main(1, c, 0, false, 10, 123456);
    main(1, c, 25, false, 10, 123456);
}


#[test]
fn test_placement_11() {
    assert(is_hit(11, 0) == false);
    assert(is_hit(11, 1) == false);
    assert(is_hit(11, 2) == false);
    assert(is_hit(11, 3) == false);
    assert(is_hit(11, 4) == false);
    assert(is_hit(11, 5) == true);
    assert(is_hit(11, 6) == true);
    assert(is_hit(11, 7) == true);
    assert(is_hit(11, 8) == true);
    assert(is_hit(11, 9) == false);
    assert(is_hit(11, 10) == false);
    assert(is_hit(11, 11) == false);
    assert(is_hit(11, 12) == false);
    assert(is_hit(11, 13) == false);
    assert(is_hit(11, 14) == false);
    assert(is_hit(11, 15) == false);
    assert(is_hit(11, 16) == false);
    assert(is_hit(11, 17) == false);
    assert(is_hit(11, 18) == false);
    assert(is_hit(11, 19) == false);
    assert(is_hit(11, 20) == false);
    assert(is_hit(11, 21) == false);
    assert(is_hit(11, 22) == false);
    assert(is_hit(11, 23) == false);
    assert(is_hit(11, 24) == false);
    let c = board_commitment(1, 11, 123456);
    main(1, c, 5, true, 11, 123456);
    main(1, c, 0, false, 11, 123456);
    main(1, c, 25, false, 11, 123456);
}


#[test]
fn test_placement_12() {
    assert(is_hit(12, 0) == false);
    assert(is_hit(12, 1) == false);
    assert(is_hit(12, 2) == false);
    assert(is_hit(12, 3) == false);
    assert(is_hit(12, 4) == false);
    assert(is_hit(12, 5) == true);
    assert(is_hit(12, 6) == false);
    assert(is_hit(12, 7) == false);
    assert(is_hit(12, 8) == false);
    assert(is_hit(12, 9) == false);
    assert(is_hit(12, 10) == true);
    assert(is_hit(12, 11) == false);
    assert(is_hit(12, 12) == false);
    assert(is_hit(12, 13) == false);
    assert(is_hit(12, 14) == false);
    assert(is_hit(12, 15) == true);
    assert(is_hit(12, 16) == false);
    assert(is_hit(12, 17) == false);
    assert(is_hit(12, 18) == false);
    assert(is_hit(12, 19) == false);
    assert(is_hit(12, 20) == true);
    assert(is_hit(12, 21) == false);
    assert(is_hit(12, 22) == false);
    assert(is_hit(12, 23) == false);
    assert(is_hit(12, 24) == false);
    let c = board_commitment(1, 12, 123456);
    main(1, c, 5, true, 12, 123456);
    main(1, c, 0, false, 12, 123456);
    main(1, c, 25, false, 12, 123456);
}


#[test]
fn test_placement_13() {
    assert(is_hit(13, 0) == false);
    assert(is_hit(13, 1) == false);
    assert(is_hit(13, 2) == false);
    assert(is_hit(13, 3) == false);
    assert(is_hit(13, 4) == false);
    assert(is_hit(13, 5) == true);
    assert(is_hit(13, 6) == false);
    assert(is_hit(13, 7) == false);
    assert(is_hit(13, 8) == false);
    assert(is_hit(13, 9) == false);
    assert(is_hit(13, 10) == false);
    assert(is_hit(13, 11) == true);
    assert(is_hit(13, 12) == false);
    assert(is_hit(13, 13) == false);
    assert(is_hit(13, 14) == false);
    assert(is_hit(13, 15) == false);
    assert(is_hit(13, 16) == false);
    assert(is_hit(13, 17) == true);
    assert(is_hit(13, 18) == false);
    assert(is_hit(13, 19) == false);
    assert(is_hit(13, 20) == false);
    assert(is_hit(13, 21) == false);
    assert(is_hit(13, 22) == false);
    assert(is_hit(13, 23) == true);
    assert(is_hit(13, 24) == false);
    let c = board_commitment(1, 13, 123456);
    main(1, c, 5, true, 13, 123456);
    main(1, c, 0, false, 13, 123456);
    main(1, c, 25, false, 13, 123456);
}


#[test]
fn test_placement_14() {
    assert(is_hit(14, 0) == false);
    assert(is_hit(14, 1) == false);
    assert(is_hit(14, 2) == false);
    assert(is_hit(14, 3) == false);
    assert(is_hit(14, 4) == false);
    assert(is_hit(14, 5) == false);
    assert(is_hit(14, 6) == true);
    assert(is_hit(14, 7) == true);
    assert(is_hit(14, 8) == true);
    assert(is_hit(14, 9) == true);
    assert(is_hit(14, 10) == false);
    assert(is_hit(14, 11) == false);
    assert(is_hit(14, 12) == false);
    assert(is_hit(14, 13) == false);
    assert(is_hit(14, 14) == false);
    assert(is_hit(14, 15) == false);
    assert(is_hit(14, 16) == false);
    assert(is_hit(14, 17) == false);
    assert(is_hit(14, 18) == false);
    assert(is_hit(14, 19) == false);
    assert(is_hit(14, 20) == false);
    assert(is_hit(14, 21) == false);
    assert(is_hit(14, 22) == false);
    assert(is_hit(14, 23) == false);
    assert(is_hit(14, 24) == false);
    let c = board_commitment(1, 14, 123456);
    main(1, c, 6, true, 14, 123456);
    main(1, c, 0, false, 14, 123456);
    main(1, c, 25, false, 14, 123456);
}


#[test]
fn test_placement_15() {
    assert(is_hit(15, 0) == false);
    assert(is_hit(15, 1) == false);
    assert(is_hit(15, 2) == false);
    assert(is_hit(15, 3) == false);
    assert(is_hit(15, 4) == false);
    assert(is_hit(15, 5) == false);
    assert(is_hit(15, 6) == true);
    assert(is_hit(15, 7) == false);
    assert(is_hit(15, 8) == false);
    assert(is_hit(15, 9) == false);
    assert(is_hit(15, 10) == false);
    assert(is_hit(15, 11) == true);
    assert(is_hit(15, 12) == false);
    assert(is_hit(15, 13) == false);
    assert(is_hit(15, 14) == false);
    assert(is_hit(15, 15) == false);
    assert(is_hit(15, 16) == true);
    assert(is_hit(15, 17) == false);
    assert(is_hit(15, 18) == false);
    assert(is_hit(15, 19) == false);
    assert(is_hit(15, 20) == false);
    assert(is_hit(15, 21) == true);
    assert(is_hit(15, 22) == false);
    assert(is_hit(15, 23) == false);
    assert(is_hit(15, 24) == false);
    let c = board_commitment(1, 15, 123456);
    main(1, c, 6, true, 15, 123456);
    main(1, c, 0, false, 15, 123456);
    main(1, c, 25, false, 15, 123456);
}


#[test]
fn test_placement_16() {
    assert(is_hit(16, 0) == false);
    assert(is_hit(16, 1) == false);
    assert(is_hit(16, 2) == false);
    assert(is_hit(16, 3) == false);
    assert(is_hit(16, 4) == false);
    assert(is_hit(16, 5) == false);
    assert(is_hit(16, 6) == true);
    assert(is_hit(16, 7) == false);
    assert(is_hit(16, 8) == false);
    assert(is_hit(16, 9) == false);
    assert(is_hit(16, 10) == false);
    assert(is_hit(16, 11) == false);
    assert(is_hit(16, 12) == true);
    assert(is_hit(16, 13) == false);
    assert(is_hit(16, 14) == false);
    assert(is_hit(16, 15) == false);
    assert(is_hit(16, 16) == false);
    assert(is_hit(16, 17) == false);
    assert(is_hit(16, 18) == true);
    assert(is_hit(16, 19) == false);
    assert(is_hit(16, 20) == false);
    assert(is_hit(16, 21) == false);
    assert(is_hit(16, 22) == false);
    assert(is_hit(16, 23) == false);
    assert(is_hit(16, 24) == true);
    let c = board_commitment(1, 16, 123456);
    main(1, c, 6, true, 16, 123456);
    main(1, c, 0, false, 16, 123456);
    main(1, c, 25, false, 16, 123456);
}


#[test]
fn test_placement_17() {
    assert(is_hit(17, 0) == false);
    assert(is_hit(17, 1) == false);
    assert(is_hit(17, 2) == false);
    assert(is_hit(17, 3) == false);
    assert(is_hit(17, 4) == false);
    assert(is_hit(17, 5) == false);
    assert(is_hit(17, 6) == false);
    assert(is_hit(17, 7) == true);
    assert(is_hit(17, 8) == false);
    assert(is_hit(17, 9) == false);
    assert(is_hit(17, 10) == false);
    assert(is_hit(17, 11) == false);
    assert(is_hit(17, 12) == true);
    assert(is_hit(17, 13) == false);
    assert(is_hit(17, 14) == false);
    assert(is_hit(17, 15) == false);
    assert(is_hit(17, 16) == false);
    assert(is_hit(17, 17) == true);
    assert(is_hit(17, 18) == false);
    assert(is_hit(17, 19) == false);
    assert(is_hit(17, 20) == false);
    assert(is_hit(17, 21) == false);
    assert(is_hit(17, 22) == true);
    assert(is_hit(17, 23) == false);
    assert(is_hit(17, 24) == false);
    let c = board_commitment(1, 17, 123456);
    main(1, c, 7, true, 17, 123456);
    main(1, c, 0, false, 17, 123456);
    main(1, c, 25, false, 17, 123456);
}


#[test]
fn test_placement_18() {
    assert(is_hit(18, 0) == false);
    assert(is_hit(18, 1) == false);
    assert(is_hit(18, 2) == false);
    assert(is_hit(18, 3) == false);
    assert(is_hit(18, 4) == false);
    assert(is_hit(18, 5) == false);
    assert(is_hit(18, 6) == false);
    assert(is_hit(18, 7) == false);
    assert(is_hit(18, 8) == true);
    assert(is_hit(18, 9) == false);
    assert(is_hit(18, 10) == false);
    assert(is_hit(18, 11) == false);
    assert(is_hit(18, 12) == false);
    assert(is_hit(18, 13) == true);
    assert(is_hit(18, 14) == false);
    assert(is_hit(18, 15) == false);
    assert(is_hit(18, 16) == false);
    assert(is_hit(18, 17) == false);
    assert(is_hit(18, 18) == true);
    assert(is_hit(18, 19) == false);
    assert(is_hit(18, 20) == false);
    assert(is_hit(18, 21) == false);
    assert(is_hit(18, 22) == false);
    assert(is_hit(18, 23) == true);
    assert(is_hit(18, 24) == false);
    let c = board_commitment(1, 18, 123456);
    main(1, c, 8, true, 18, 123456);
    main(1, c, 0, false, 18, 123456);
    main(1, c, 25, false, 18, 123456);
}


#[test]
fn test_placement_19() {
    assert(is_hit(19, 0) == false);
    assert(is_hit(19, 1) == false);
    assert(is_hit(19, 2) == false);
    assert(is_hit(19, 3) == false);
    assert(is_hit(19, 4) == false);
    assert(is_hit(19, 5) == false);
    assert(is_hit(19, 6) == false);
    assert(is_hit(19, 7) == false);
    assert(is_hit(19, 8) == true);
    assert(is_hit(19, 9) == false);
    assert(is_hit(19, 10) == false);
    assert(is_hit(19, 11) == false);
    assert(is_hit(19, 12) == true);
    assert(is_hit(19, 13) == false);
    assert(is_hit(19, 14) == false);
    assert(is_hit(19, 15) == false);
    assert(is_hit(19, 16) == true);
    assert(is_hit(19, 17) == false);
    assert(is_hit(19, 18) == false);
    assert(is_hit(19, 19) == false);
    assert(is_hit(19, 20) == true);
    assert(is_hit(19, 21) == false);
    assert(is_hit(19, 22) == false);
    assert(is_hit(19, 23) == false);
    assert(is_hit(19, 24) == false);
    let c = board_commitment(1, 19, 123456);
    main(1, c, 8, true, 19, 123456);
    main(1, c, 0, false, 19, 123456);
    main(1, c, 25, false, 19, 123456);
}


#[test]
fn test_placement_20() {
    assert(is_hit(20, 0) == false);
    assert(is_hit(20, 1) == false);
    assert(is_hit(20, 2) == false);
    assert(is_hit(20, 3) == false);
    assert(is_hit(20, 4) == false);
    assert(is_hit(20, 5) == false);
    assert(is_hit(20, 6) == false);
    assert(is_hit(20, 7) == false);
    assert(is_hit(20, 8) == false);
    assert(is_hit(20, 9) == true);
    assert(is_hit(20, 10) == false);
    assert(is_hit(20, 11) == false);
    assert(is_hit(20, 12) == false);
    assert(is_hit(20, 13) == false);
    assert(is_hit(20, 14) == true);
    assert(is_hit(20, 15) == false);
    assert(is_hit(20, 16) == false);
    assert(is_hit(20, 17) == false);
    assert(is_hit(20, 18) == false);
    assert(is_hit(20, 19) == true);
    assert(is_hit(20, 20) == false);
    assert(is_hit(20, 21) == false);
    assert(is_hit(20, 22) == false);
    assert(is_hit(20, 23) == false);
    assert(is_hit(20, 24) == true);
    let c = board_commitment(1, 20, 123456);
    main(1, c, 9, true, 20, 123456);
    main(1, c, 0, false, 20, 123456);
    main(1, c, 25, false, 20, 123456);
}


#[test]
fn test_placement_21() {
    assert(is_hit(21, 0) == false);
    assert(is_hit(21, 1) == false);
    assert(is_hit(21, 2) == false);
    assert(is_hit(21, 3) == false);
    assert(is_hit(21, 4) == false);
    assert(is_hit(21, 5) == false);
    assert(is_hit(21, 6) == false);
    assert(is_hit(21, 7) == false);
    assert(is_hit(21, 8) == false);
    assert(is_hit(21, 9) == true);
    assert(is_hit(21, 10) == false);
    assert(is_hit(21, 11) == false);
    assert(is_hit(21, 12) == false);
    assert(is_hit(21, 13) == true);
    assert(is_hit(21, 14) == false);
    assert(is_hit(21, 15) == false);
    assert(is_hit(21, 16) == false);
    assert(is_hit(21, 17) == true);
    assert(is_hit(21, 18) == false);
    assert(is_hit(21, 19) == false);
    assert(is_hit(21, 20) == false);
    assert(is_hit(21, 21) == true);
    assert(is_hit(21, 22) == false);
    assert(is_hit(21, 23) == false);
    assert(is_hit(21, 24) == false);
    let c = board_commitment(1, 21, 123456);
    main(1, c, 9, true, 21, 123456);
    main(1, c, 0, false, 21, 123456);
    main(1, c, 25, false, 21, 123456);
}


#[test]
fn test_placement_22() {
    assert(is_hit(22, 0) == false);
    assert(is_hit(22, 1) == false);
    assert(is_hit(22, 2) == false);
    assert(is_hit(22, 3) == false);
    assert(is_hit(22, 4) == false);
    assert(is_hit(22, 5) == false);
    assert(is_hit(22, 6) == false);
    assert(is_hit(22, 7) == false);
    assert(is_hit(22, 8) == false);
    assert(is_hit(22, 9) == false);
    assert(is_hit(22, 10) == true);
    assert(is_hit(22, 11) == true);
    assert(is_hit(22, 12) == true);
    assert(is_hit(22, 13) == true);
    assert(is_hit(22, 14) == false);
    assert(is_hit(22, 15) == false);
    assert(is_hit(22, 16) == false);
    assert(is_hit(22, 17) == false);
    assert(is_hit(22, 18) == false);
    assert(is_hit(22, 19) == false);
    assert(is_hit(22, 20) == false);
    assert(is_hit(22, 21) == false);
    assert(is_hit(22, 22) == false);
    assert(is_hit(22, 23) == false);
    assert(is_hit(22, 24) == false);
    let c = board_commitment(1, 22, 123456);
    main(1, c, 10, true, 22, 123456);
    main(1, c, 0, false, 22, 123456);
    main(1, c, 25, false, 22, 123456);
}


#[test]
fn test_placement_23() {
    assert(is_hit(23, 0) == false);
    assert(is_hit(23, 1) == false);
    assert(is_hit(23, 2) == false);
    assert(is_hit(23, 3) == false);
    assert(is_hit(23, 4) == false);
    assert(is_hit(23, 5) == false);
    assert(is_hit(23, 6) == false);
    assert(is_hit(23, 7) == false);
    assert(is_hit(23, 8) == false);
    assert(is_hit(23, 9) == false);
    assert(is_hit(23, 10) == false);
    assert(is_hit(23, 11) == true);
    assert(is_hit(23, 12) == true);
    assert(is_hit(23, 13) == true);
    assert(is_hit(23, 14) == true);
    assert(is_hit(23, 15) == false);
    assert(is_hit(23, 16) == false);
    assert(is_hit(23, 17) == false);
    assert(is_hit(23, 18) == false);
    assert(is_hit(23, 19) == false);
    assert(is_hit(23, 20) == false);
    assert(is_hit(23, 21) == false);
    assert(is_hit(23, 22) == false);
    assert(is_hit(23, 23) == false);
    assert(is_hit(23, 24) == false);
    let c = board_commitment(1, 23, 123456);
    main(1, c, 11, true, 23, 123456);
    main(1, c, 0, false, 23, 123456);
    main(1, c, 25, false, 23, 123456);
}


#[test]
fn test_placement_24() {
    assert(is_hit(24, 0) == false);
    assert(is_hit(24, 1) == false);
    assert(is_hit(24, 2) == false);
    assert(is_hit(24, 3) == false);
    assert(is_hit(24, 4) == false);
    assert(is_hit(24, 5) == false);
    assert(is_hit(24, 6) == false);
    assert(is_hit(24, 7) == false);
    assert(is_hit(24, 8) == false);
    assert(is_hit(24, 9) == false);
    assert(is_hit(24, 10) == false);
    assert(is_hit(24, 11) == false);
    assert(is_hit(24, 12) == false);
    assert(is_hit(24, 13) == false);
    assert(is_hit(24, 14) == false);
    assert(is_hit(24, 15) == true);
    assert(is_hit(24, 16) == true);
    assert(is_hit(24, 17) == true);
    assert(is_hit(24, 18) == true);
    assert(is_hit(24, 19) == false);
    assert(is_hit(24, 20) == false);
    assert(is_hit(24, 21) == false);
    assert(is_hit(24, 22) == false);
    assert(is_hit(24, 23) == false);
    assert(is_hit(24, 24) == false);
    let c = board_commitment(1, 24, 123456);
    main(1, c, 15, true, 24, 123456);
    main(1, c, 0, false, 24, 123456);
    main(1, c, 25, false, 24, 123456);
}


#[test]
fn test_placement_25() {
    assert(is_hit(25, 0) == false);
    assert(is_hit(25, 1) == false);
    assert(is_hit(25, 2) == false);
    assert(is_hit(25, 3) == false);
    assert(is_hit(25, 4) == false);
    assert(is_hit(25, 5) == false);
    assert(is_hit(25, 6) == false);
    assert(is_hit(25, 7) == false);
    assert(is_hit(25, 8) == false);
    assert(is_hit(25, 9) == false);
    assert(is_hit(25, 10) == false);
    assert(is_hit(25, 11) == false);
    assert(is_hit(25, 12) == false);
    assert(is_hit(25, 13) == false);
    assert(is_hit(25, 14) == false);
    assert(is_hit(25, 15) == false);
    assert(is_hit(25, 16) == true);
    assert(is_hit(25, 17) == true);
    assert(is_hit(25, 18) == true);
    assert(is_hit(25, 19) == true);
    assert(is_hit(25, 20) == false);
    assert(is_hit(25, 21) == false);
    assert(is_hit(25, 22) == false);
    assert(is_hit(25, 23) == false);
    assert(is_hit(25, 24) == false);
    let c = board_commitment(1, 25, 123456);
    main(1, c, 16, true, 25, 123456);
    main(1, c, 0, false, 25, 123456);
    main(1, c, 25, false, 25, 123456);
}


#[test]
fn test_placement_26() {
    assert(is_hit(26, 0) == false);
    assert(is_hit(26, 1) == false);
    assert(is_hit(26, 2) == false);
    assert(is_hit(26, 3) == false);
    assert(is_hit(26, 4) == false);
    assert(is_hit(26, 5) == false);
    assert(is_hit(26, 6) == false);
    assert(is_hit(26, 7) == false);
    assert(is_hit(26, 8) == false);
    assert(is_hit(26, 9) == false);
    assert(is_hit(26, 10) == false);
    assert(is_hit(26, 11) == false);
    assert(is_hit(26, 12) == false);
    assert(is_hit(26, 13) == false);
    assert(is_hit(26, 14) == false);
    assert(is_hit(26, 15) == false);
    assert(is_hit(26, 16) == false);
    assert(is_hit(26, 17) == false);
    assert(is_hit(26, 18) == false);
    assert(is_hit(26, 19) == false);
    assert(is_hit(26, 20) == true);
    assert(is_hit(26, 21) == true);
    assert(is_hit(26, 22) == true);
    assert(is_hit(26, 23) == true);
    assert(is_hit(26, 24) == false);
    let c = board_commitment(1, 26, 123456);
    main(1, c, 20, true, 26, 123456);
    main(1, c, 0, false, 26, 123456);
    main(1, c, 25, false, 26, 123456);
}


#[test]
fn test_placement_27() {
    assert(is_hit(27, 0) == false);
    assert(is_hit(27, 1) == false);
    assert(is_hit(27, 2) == false);
    assert(is_hit(27, 3) == false);
    assert(is_hit(27, 4) == false);
    assert(is_hit(27, 5) == false);
    assert(is_hit(27, 6) == false);
    assert(is_hit(27, 7) == false);
    assert(is_hit(27, 8) == false);
    assert(is_hit(27, 9) == false);
    assert(is_hit(27, 10) == false);
    assert(is_hit(27, 11) == false);
    assert(is_hit(27, 12) == false);
    assert(is_hit(27, 13) == false);
    assert(is_hit(27, 14) == false);
    assert(is_hit(27, 15) == false);
    assert(is_hit(27, 16) == false);
    assert(is_hit(27, 17) == false);
    assert(is_hit(27, 18) == false);
    assert(is_hit(27, 19) == false);
    assert(is_hit(27, 20) == false);
    assert(is_hit(27, 21) == true);
    assert(is_hit(27, 22) == true);
    assert(is_hit(27, 23) == true);
    assert(is_hit(27, 24) == true);
    let c = board_commitment(1, 27, 123456);
    main(1, c, 21, true, 27, 123456);
    main(1, c, 0, false, 27, 123456);
    main(1, c, 25, false, 27, 123456);
}

#[test(should_fail_with = "Incorrect probe response")]
fn test_false_hit() {
    let c = board_commitment(1, 0, 123456);
    main(1, c, 24, true, 0, 123456);
}

#[test(should_fail_with = "Incorrect probe response")]
fn test_false_miss() {
    let c = board_commitment(1, 0, 123456);
    main(1, c, 0, false, 0, 123456);
}

#[test(should_fail_with = "Commitment mismatch")]
fn test_changed_board() {
    let c = board_commitment(1, 0, 123456);
    main(1, c, 0, true, 1, 123456);
}

#[test(should_fail_with = "Commitment mismatch")]
fn test_changed_salt() {
    let c = board_commitment(1, 0, 123456);
    main(1, c, 0, true, 0, 123457);
}

#[test(should_fail_with = "Commitment mismatch")]
fn test_changed_challenge() {
    let c = board_commitment(1, 0, 123456);
    main(2, c, 0, true, 0, 123456);
}

#[test(should_fail_with = "Invalid placement")]
fn test_invalid_placement() {
    let c = board_commitment(1, 28, 123456);
    main(1, c, 0, false, 28, 123456);
}

#[test(should_fail_with = "Invalid square")]
fn test_invalid_square() {
    let c = board_commitment(1, 0, 123456);
    main(1, c, 26, false, 0, 123456);
}

#[test(should_fail_with = "Invalid salt")]
fn test_zero_salt() {
    let c = board_commitment(1, 0, 0);
    main(1, c, 0, true, 0, 0);
}

#[test(should_fail_with = "Invalid challenge ID")]
fn test_invalid_challenge() {
    let c = board_commitment(0, 0, 123456);
    main(0, c, 0, true, 0, 123456);
}

#[test(should_fail_with = "Incorrect probe response")]
fn test_invalid_registration() {
    let c = board_commitment(1, 0, 123456);
    main(1, c, 25, true, 0, 123456);
}

#[test]
fn test_commitment_separation() {
    let c = board_commitment(1, 0, 123456);

    assert(c != board_commitment(2, 0, 123456));
    assert(c != board_commitment(1, 1, 123456));
    assert(c != board_commitment(1, 0, 123457));
}
