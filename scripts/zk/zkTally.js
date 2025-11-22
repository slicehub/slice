import fs from "fs";
import { execSync } from "child_process";
import { CONFIG } from "./constants.js";

export async function generateTallyProof(votes, salts) {
  const input = {
    votes,
    salts,
    juror_count: CONFIG.JUROR_COUNT,
    commitments: CONFIG.CONTRACT_COMMITMENTS,
    dispute_id: CONFIG.DISPUTE_ID,
    juror_addresses: CONFIG.DISPUTE_JUROR_ADDRESSES,
    contract_commitments: CONFIG.CONTRACT_COMMITMENTS,
    contract_jurors: CONFIG.CONTRACT_JURORS,
  };

  fs.mkdirSync(CONFIG.TMP, { recursive: true });
  const inputPath = `${CONFIG.TMP}/tally_input.json`;
  fs.writeFileSync(inputPath, JSON.stringify(input, null, 2));

  // must cd inside circuit folder
  const cmd = `
    cd ${CONFIG.CIRCUITS_DIR}/${CONFIG.TALLY_CIRCUIT} && \
    ${CONFIG.NARGO} prove --input ../../tmp/tally_input.json
  `;

  execSync(cmd, { stdio: "inherit", shell: "/bin/bash" });

  const proof = fs.readFileSync(
    `${CONFIG.CIRCUCTS_DIR}/${CONFIG.TALLY_CIRCUIT}/proofs/proof`,
  );
  const publicInputs = fs.readFileSync(
    `${CONFIG.CIRCUITS_DIR}/${CONFIG.TALLY_CIRCUIT}/proofs/public_inputs`,
  );

  return { proof, publicInputs };
}
