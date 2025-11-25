#!/bin/bash
set -e # Stop on first error

# ==============================================================================
# CONFIGURATION
# ==============================================================================
NETWORK="local"
SLICE_ALIAS="slice"
HONK_ALIAS="ultrahonk_soroban_contract"

# Paths to WASM (Ensure you have run 'stellar contract build' & 'optimize')
SLICE_WASM="target/wasm32v1-none/release/slice.optimized.wasm"
HONK_WASM="target/wasm32v1-none/release/ultrahonk_soroban_contract.optimized.wasm"

# Identities
ADMIN="default"
CLAIMER="claimer"
DEFENDER="defender"
JUROR_PREFIX="bot_juror"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================

setup_identity() {
    if ! stellar keys address $1 > /dev/null 2>&1; then
        echo "Creating $1..."
        stellar keys generate $1 --network $NETWORK
    fi
    # Fund to ensure gas
    stellar keys fund $1 --network $NETWORK > /dev/null 2>&1
}

# Calculates SHA256(vote_u32_be || salt_32bytes)
calc_commitment() {
    local vote=$1
    local salt=$2
    local vote_hex=$(printf "%08x" $vote)
    local input_hex="${vote_hex}${salt}"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo -n "$input_hex" | xxd -r -p | shasum -a 256 | awk '{print $1}'
    else
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

# Create 4 Bot Jurors (We leave the 5th slot for YOU in the UI)
for i in 1 2 3 4; do
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
    --alias $HONK_ALIAS > /dev/null

echo "Deploying Slice..."
stellar contract deploy \
    --wasm $SLICE_WASM \
    --source $ADMIN \
    --network $NETWORK \
    --alias $SLICE_ALIAS \
    -- \
    --admin $ADMIN \
    --min_pay_seconds 60 \
    --max_pay_seconds 864000 \
    --min_commit_seconds 60 \
    --max_commit_seconds 864000 \
    --min_reveal_seconds 60 \
    --max_reveal_seconds 864000

# ==============================================================================
# 3. INITIALIZE DISPUTE
# ==============================================================================
echo -e "${BLUE}>>> 3. Creating & Funding Dispute...${NC}"

# Add Category
stellar contract invoke --source $ADMIN --network $NETWORK --id $SLICE_ALIAS -- \
    add_category --name "General" > /dev/null 2>&1 || true # Ignore if exists

# Create Dispute (Requiring 5 Jurors)
# Using a dummy IPFS hash
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
    --min_amount 1 \
    --max_amount 1000 \
    --category "General" \
    --jurors_required 5 \
    --limits '{"pay_seconds": 3600, "commit_seconds": 3600, "reveal_seconds": 3600}' > /dev/null

# Since this is a fresh deploy, assume ID is 1.
# In a real script we'd parse the JSON output, but this is for dev speed.
DISPUTE_ID=1

echo "Claimer paying..."
stellar contract invoke --source $CLAIMER --network $NETWORK --id $SLICE_ALIAS -- \
    pay_dispute --caller $CLAIMER --dispute_id $DISPUTE_ID --amount 500 > /dev/null

echo "Defender paying..."
stellar contract invoke --source $DEFENDER --network $NETWORK --id $SLICE_ALIAS -- \
    pay_dispute --caller $DEFENDER --dispute_id $DISPUTE_ID --amount 500 > /dev/null

echo -e "${GREEN}✓ Dispute #$DISPUTE_ID is funded and in COMMIT phase.${NC}"

# ==============================================================================
# 4. ASSIGN BOT JURORS
# ==============================================================================
echo -e "${BLUE}>>> 4a. Assigning 4 Bot Jurors...${NC}"

# Loop 1: Assign ALL jurors first
for i in 1 2 3 4; do
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
        --stake_amount 200 > /dev/null
done

echo -e "${BLUE}>>> 4b. Committing Votes for 4 Bot Jurors...${NC}"

# Fixed salt for bots
SALT="0000000000000000000000000000000000000000000000000000000000000001"
VOTES=(0 1 0 1)

# Loop 2: Commit votes AFTER everyone is assigned
for i in 1 2 3 4; do
    CURRENT_JUROR="${JUROR_PREFIX}${i}"
    VOTE=${VOTES[$((i-1))]}

    COMMITMENT=$(calc_commitment $VOTE $SALT)
    echo "  -> $CURRENT_JUROR committing vote '$VOTE'..."

    stellar contract invoke \
        --source $CURRENT_JUROR \
        --network $NETWORK \
        --id $SLICE_ALIAS \
        -- \
        commit_vote \
        --caller $CURRENT_JUROR \
        --dispute_id $DISPUTE_ID \
        --commitment $COMMITMENT > /dev/null
done

# ==============================================================================
# 5. READY
# ==============================================================================
echo -e "${GREEN}=======================================================${NC}"
echo -e "${GREEN}>>> SETUP COMPLETE!${NC}"
echo -e "${GREEN}=======================================================${NC}"
echo "Dispute ID: $DISPUTE_ID"
echo "Status: 4/5 Jurors assigned and committed."
echo ""
echo "You can now open the frontend using ANY fresh wallet (e.g., 'default')."
echo "1. Go to the Dispute."
echo "2. Click 'Assign as Juror' (You will be the 5th)."
echo "3. Click 'Commit Vote'."
echo "   -> This will trigger the contract to switch to REVEAL phase."
echo "4. Click 'Reveal Vote'."
echo -e "${GREEN}=======================================================${NC}"
