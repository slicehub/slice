#!/bin/bash
set -e # Stop on first error

# ==============================================================================
# CONFIGURATION
# ==============================================================================
NETWORK="local"
SLICE_ALIAS="slice"
HONK_ALIAS="ultrahonk_soroban_contract" # Still needed for deployment dependency if imported

# WASM Paths (Ensure you have built and optimized these)
SLICE_WASM="target/wasm32v1-none/release/slice.optimized.wasm"
HONK_WASM="target/wasm32v1-none/release/ultrahonk_soroban_contract.optimized.wasm"

# Identities
ADMIN="default"
CLAIMER="claimer"
DEFENDER="defender"
JUROR_PREFIX="juror"
JUROR_COUNT=5

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================

setup_identity() {
    if ! stellar keys address $1 > /dev/null 2>&1; then
        echo "Creating $1..."
        stellar keys generate $1 --network $NETWORK
    fi
    # Always fund to ensure gas
    echo "Funding $1..."
    stellar keys fund $1 --network $NETWORK > /dev/null 2>&1
}

# Calculates SHA256(vote_u32_be || salt_32bytes)
# vote: integer (0 or 1)
# salt: 32-byte hex string (64 chars)
calc_commitment() {
    local vote=$1
    local salt=$2

    # Convert vote to 4-byte Big Endian Hex (e.g., 0 -> 00000000)
    local vote_hex=$(printf "%08x" $vote)

    # Concatenate vote_hex + salt_hex
    local input_hex="${vote_hex}${salt}"

    # Calculate SHA256 of the binary data
    # echo -n parses the hex string into bytes, openssl computes hash
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        echo -n "$input_hex" | xxd -r -p | shasum -a 256 | awk '{print $1}'
    else
        # Linux
        echo -n "$input_hex" | xxd -r -p | sha256sum | awk '{print $1}'
    fi
}

# ==============================================================================
# 1. SETUP IDENTITIES
# ==============================================================================
echo -e "${BLUE}>>> 1. Setting up Identities...${NC}"

setup_identity $ADMIN
setup_identity $CLAIMER
setup_identity $DEFENDER

for ((i=1; i<=JUROR_COUNT; i++)); do
   setup_identity "${JUROR_PREFIX}${i}"
done

# ==============================================================================
# 2. DEPLOY CONTRACTS
# ==============================================================================
echo -e "${BLUE}>>> 2. Deploying Contracts...${NC}"

echo "Deploying UltraHonk (Dependency)..."
stellar contract deploy \
    --wasm $HONK_WASM \
    --source $ADMIN \
    --network $NETWORK \
    --alias $HONK_ALIAS

echo "Deploying Slice..."
# Note: We deploy with short timers for the demo flow to work quickly if we were waiting,
# but here we are driving the state manually so timers just need to be valid.
stellar contract deploy \
    --wasm $SLICE_WASM \
    --source $ADMIN \
    --network $NETWORK \
    --alias $SLICE_ALIAS \
    -- \
    --admin $ADMIN \
    --min_pay_seconds 60 \
    --max_pay_seconds 86400 \
    --min_commit_seconds 60 \
    --max_commit_seconds 86400 \
    --min_reveal_seconds 60 \
    --max_reveal_seconds 86400

# ==============================================================================
# 3. INITIALIZE PROTOCOL
# ==============================================================================
echo -e "${BLUE}>>> 3. Initializing Protocol...${NC}"

echo "Adding 'General' category..."
stellar contract invoke \
    --source $ADMIN \
    --network $NETWORK \
    --id $SLICE_ALIAS \
    -- \
    add_category \
    --name "General"

# ==============================================================================
# 4. CREATE DISPUTE
# ==============================================================================
echo -e "${BLUE}>>> 4. Creating Dispute...${NC}"

# Using a dummy meta_hash (32 bytes hex)
META_HASH="0000000000000000000000000000000000000000000000000000000000000001"

stellar contract invoke \
    --source $ADMIN \
    --network $NETWORK \
    --id $SLICE_ALIAS \
    -- \
    create_dispute \
    --claimer $CLAIMER \
    --defender $DEFENDER \
    --meta_hash $META_HASH \
    --min_amount 100 \
    --max_amount 1000 \
    --category "General" \
    --jurors_required $JUROR_COUNT \
    --limits '{"pay_seconds": 3600, "commit_seconds": 3600, "reveal_seconds": 3600}'

# Assuming ID 1 for fresh deploy
DISPUTE_ID=1
echo -e "${GREEN}✓ Dispute $DISPUTE_ID created.${NC}"

# ==============================================================================
# 5. FUND DISPUTE
# ==============================================================================
echo -e "${BLUE}>>> 5. Funding Dispute...${NC}"

echo "Claimer paying 500..."
stellar contract invoke \
    --source $CLAIMER \
    --network $NETWORK \
    --id $SLICE_ALIAS \
    -- \
    pay_dispute \
    --caller $CLAIMER \
    --dispute_id $DISPUTE_ID \
    --amount 500

echo "Defender paying 500..."
stellar contract invoke \
    --source $DEFENDER \
    --network $NETWORK \
    --id $SLICE_ALIAS \
    -- \
    pay_dispute \
    --caller $DEFENDER \
    --dispute_id $DISPUTE_ID \
    --amount 500

echo -e "${GREEN}✓ Dispute funded. Status is now COMMIT.${NC}"

# ==============================================================================
# 6. ASSIGN JURORS
# ==============================================================================
echo -e "${BLUE}>>> 6. Assigning $JUROR_COUNT Jurors...${NC}"

for ((i=1; i<=JUROR_COUNT; i++)); do
    CURRENT_JUROR="${JUROR_PREFIX}${i}"
    echo "Assigning $CURRENT_JUROR..."

    stellar contract invoke \
        --source $CURRENT_JUROR \
        --network $NETWORK \
        --id $SLICE_ALIAS \
        -- \
        assign_dispute \
        --caller $CURRENT_JUROR \
        --category "General" \
        --stake_amount 200
done

# ==============================================================================
# 7. COMMIT VOTES
# ==============================================================================
echo -e "${BLUE}>>> 7. Committing Votes...${NC}"

# Define Votes: 3 votes for 0 (Claimer), 2 votes for 1 (Defender) -> Claimer Wins
# We use a fixed salt for simplicity in this demo script
SALT="0000000000000000000000000000000000000000000000000000000000000001"

# Pre-calculated votes array
# Juror 1, 2, 3 vote 0
# Juror 4, 5 vote 1
VOTES=(0 0 0 1 1)

for ((i=1; i<=JUROR_COUNT; i++)); do
    CURRENT_JUROR="${JUROR_PREFIX}${i}"
    VOTE=${VOTES[$((i-1))]}

    # Calculate commitment locally
    COMMITMENT=$(calc_commitment $VOTE $SALT)

    echo "$CURRENT_JUROR committing vote $VOTE (Hash: $COMMITMENT)..."

    stellar contract invoke \
        --source $CURRENT_JUROR \
        --network $NETWORK \
        --id $SLICE_ALIAS \
        -- \
        commit_vote \
        --caller $CURRENT_JUROR \
        --dispute_id $DISPUTE_ID \
        --commitment $COMMITMENT
done

echo -e "${GREEN}✓ All votes committed. Dispute status should transition to REVEAL automatically.${NC}"

# ==============================================================================
# 8. REVEAL VOTES (BYPASSING ZK)
# ==============================================================================
echo -e "${BLUE}>>> 8. Revealing Votes...${NC}"

# Dummy data for ZK proofs (since contract logic is bypassed)
DUMMY_BYTES="deadbeef"

for ((i=1; i<=JUROR_COUNT; i++)); do
    CURRENT_JUROR="${JUROR_PREFIX}${i}"
    VOTE=${VOTES[$((i-1))]}

    echo "$CURRENT_JUROR revealing vote $VOTE..."

    stellar contract invoke \
        --source $CURRENT_JUROR \
        --network $NETWORK \
        --id $SLICE_ALIAS \
        -- \
        reveal_vote \
        --caller $CURRENT_JUROR \
        --dispute_id $DISPUTE_ID \
        --vote $VOTE \
        --salt $SALT \
        --vk_json $DUMMY_BYTES \
        --proof_blob $DUMMY_BYTES
done

echo -e "${GREEN}✓ All votes revealed.${NC}"

# ==============================================================================
# 9. EXECUTE RULING
# ==============================================================================
echo -e "${BLUE}>>> 9. Executing Ruling...${NC}"

stellar contract invoke \
    --source $ADMIN \
    --network $NETWORK \
    --id $SLICE_ALIAS \
    -- \
    execute \
    --dispute_id $DISPUTE_ID

echo -e "${GREEN}>>> SUCCESS! Dispute Resolved.${NC}"
echo "Winner should be Claimer (Vote 0 had 3/5 votes)."
echo "Check balances or events to confirm fund distribution."
