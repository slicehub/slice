const { ethers } = require("ethers");

// ==========================================
// 1. CONFIGURATION: Set your vote here
// ==========================================
const MY_VOTE = 1; // 0 = Defender, 1 = Claimer

async function main() {
  console.clear();
  console.log("\U0001f510 Generating Secure Vote Commitment...\n");

  // 2. GENERATE SALT
  // We generate a cryptographically strong random 32-byte number.
  // This is the "password" that hides your vote.
  const randomBytes = ethers.randomBytes(32);
  const salt = BigInt(ethers.hexlify(randomBytes));

  // 3. CALCULATE HASH
  // This matches Solidity: keccak256(abi.encodePacked(_vote, _salt))
  // We use "solidityPacked" to match abi.encodePacked
  const packedData = ethers.solidityPacked(
    ["uint256", "uint256"], // The types defined in the contract
    [MY_VOTE, salt], // The actual values
  );

  const commitmentHash = ethers.keccak256(packedData);

  // 4. OUTPUT
  console.log("==================================================");
  console.log("\U0001f534 STEP 1: COPY TO REMIX (commitVote function)");
  console.log("==================================================");
  console.log(`_id:         (Your Dispute ID)`);
  console.log(`_commitment: ${commitmentHash}`);
  console.log("\n");

  console.log("==================================================");
  console.log("\U0001f7e2 STEP 2: SAVE SECURELY (For Reveal Phase)");
  console.log("==================================================");
  console.log(`Vote: ${MY_VOTE}`);
  console.log(`Salt: ${salt.toString()}`);
  console.log(
    "\n\u26a0\ufe0f  WARNING: If you lose the SALT number, you cannot reveal",
  );
  console.log("    your vote and you will lose your staked ETH!");
  console.log("==================================================");
}

main();
