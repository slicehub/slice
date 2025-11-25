#!/bin/bash
set -e # Stop on first error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NETWORK="local"
ADMIN="default"
CLAIMER="claimer"
DEFENDER="defender"
SLICE_ALIAS="slice"
HONK_ALIAS="ultrahonk_soroban_contract"

# Contract Wasm Paths (Ensure these match your build output)
SLICE_WASM="target/wasm32v1-none/release/slice.optimized.wasm"
HONK_WASM="target/wasm32v1-none/release/ultrahonk_soroban_contract.optimized.wasm"

echo -e "${BLUE}>>> 1. Setting up Identities...${NC}"
# Function to create and fund if not exists
setup_identity() {
    if ! stellar keys address $1 > /dev/null 2>&1; then
        echo "Creating $1..."
        stellar keys generate $1 --network $NETWORK
    else
        echo "$1 already exists."
    fi
    # Always fund to ensure they have gas
    echo "Funding $1..."
    stellar keys fund $1 --network $NETWORK > /dev/null 2>&1
}

setup_identity $ADMIN
setup_identity $CLAIMER
setup_identity $DEFENDER

# Create 5 Jurors
for i in 1 2 3 4 5
do
   setup_identity "juror$i"
done

echo -e "${BLUE}>>> 2. Deploying Contracts...${NC}"

# Deploy UltraHonk (Dependency)
echo "Deploying UltraHonk..."
stellar contract deploy \
    --wasm $HONK_WASM \
    --source $ADMIN \
    --network $NETWORK \
    --alias $HONK_ALIAS

# Deploy Slice
echo "Deploying Slice..."
stellar contract deploy \
    --wasm $SLICE_WASM \
    --source $ADMIN \
    --network $NETWORK \
    --alias $SLICE_ALIAS \
    -- \
    --admin $ADMIN \
    --min_pay_seconds 300 \
    --max_pay_seconds 86400 \
    --min_commit_seconds 300 \
    --max_commit_seconds 86400 \
    --min_reveal_seconds 300 \
    --max_reveal_seconds 86400

echo -e "${BLUE}>>> 3. Initializing Protocol...${NC}"
# Fixes Error #20 (Category Not Found)
stellar contract invoke \
    --source $ADMIN \
    --network $NETWORK \
    --id $SLICE_ALIAS \
    -- \
    add_category \
    --name "General"

echo -e "${BLUE}>>> 4. Creating Dispute (Requiring 5 Jurors)...${NC}"
stellar contract invoke \
    --source $ADMIN \
    --network $NETWORK \
    --id $SLICE_ALIAS \
    -- \
    create_dispute \
    --claimer $CLAIMER \
    --defender $DEFENDER \
    --meta_hash 0000000000000000000000000000000000000000000000000000000000000001 \
    --min_amount 100 \
    --max_amount 1000 \
    --category "General" \
    --jurors_required 5 \
    --limits '{"pay_seconds": 3600, "commit_seconds": 3600, "reveal_seconds": 3600}'

# Note: Dispute ID is usually 1 if this is a fresh deploy.
# In a robust script, we would parse the output, but for local demo, we assume ID 1.
DISPUTE_ID=1

echo -e "${BLUE}>>> 5. Funding Dispute...${NC}"
# Fixes Error #10 (No Available Disputes) - Transitions status CREATED -> COMMIT

echo "Claimer paying..."
stellar contract invoke \
    --source $CLAIMER \
    --network $NETWORK \
    --id $SLICE_ALIAS \
    -- \
    pay_dispute \
    --caller $CLAIMER \
    --dispute_id $DISPUTE_ID \
    --amount 500

echo "Defender paying..."
stellar contract invoke \
    --source $DEFENDER \
    --network $NETWORK \
    --id $SLICE_ALIAS \
    -- \
    pay_dispute \
    --caller $DEFENDER \
    --dispute_id $DISPUTE_ID \
    --amount 500

echo -e "${GREEN}>>> Dispute $DISPUTE_ID is now funded and open for jurors (Status 1)${NC}"

echo -e "${BLUE}>>> 6. Assigning 5 Jurors...${NC}"

for i in {1..5}
do
    CURRENT_JUROR="juror$i"
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

    echo -e "${GREEN}✓ $CURRENT_JUROR Assigned${NC}"
done

echo -e "${GREEN}>>> SETUP COMPLETE!${NC}"
echo "Dispute $DISPUTE_ID has 5 jurors assigned."
echo "Next step: Jurors must commit their votes (requires hashing) and then reveal (requires ZK proofs)."
