import fs from "fs";
import { execSync } from "child_process";
import crypto from "crypto";
import { CONFIG } from "./constants.js";

export function randomSalt() {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

export async function generateVoteProof(vote = 1) {
  const salt = randomSalt();

  const inputJSON = { vote, salt };

  fs.mkdirSync(CONFIG.TMP, { recursive: true });
  const inputPath = `${CONFIG.TMP}/vote_input.json`;
  fs.writeFileSync(inputPath, JSON.stringify(inputJSON, null, 2));

  const CIRCUIT_DIR = `${CONFIG.CIRCUITS_DIR}/${CONFIG.VOTE_CIRCUIT}`;

  // 1) Compile
  execSync(`cd ${CIRCUIT_DIR} && nargo compile`, {
    stdio: "inherit",
    shell: "/bin/bash",
  });

  // 2) Create witness
  execSync(
    `cd ${CIRCUIT_DIR} && bb write-witness -b target/circuit.acir -w ../../tmp/vote_witness.json -i ../../tmp/vote_input.json`,
    { stdio: "inherit", shell: "/bin/bash" },
  );

  // 3) Prove
  execSync(
    `cd ${CIRCUIT_DIR} && bb prove -b target/circuit.acir -w ../../tmp/vote_witness.json -o ../../tmp/vote_proof`,
    { stdio: "inherit", shell: "/bin/bash" },
  );

  const proof = fs.readFileSync("./tmp/vote_proof");
  const publicInputs = fs.readFileSync("./tmp/vote_witness.json");

  return { vote, salt, proof, publicInputs };
}
