export const CONFIG = {
  DISPUTE_ID: 1,
  JUROR_INDEX: 0,
  JUROR_COUNT: 5,

  CIRCUITS_DIR: "./circuits",
  VOTE_CIRCUIT: "vote",
  TALLY_CIRCUIT: "tally",

  TMP: "./tmp",

  NARGO: "nargo",

  // cuando hagas assign_dispute real los vas a poner acá:
  CONTRACT_COMMITMENTS: Array(101).fill("0"),
  CONTRACT_JURORS: Array(101).fill("0"),
  DISPUTE_JUROR_ADDRESSES: Array(101).fill("0"),
};
