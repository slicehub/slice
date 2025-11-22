SHELL := /bin/bash

.PHONY: all build optimize deploy clean fmt

# Network Configuration (Defaulting to local/standalone as per .env.example)
NETWORK := local
SOURCE_ADMIN := default

# Identities (mapped from .config/stellar/identity/)
ADMIN := default
CLAIMER := claimer
DEFENDER := defender
JUROR := juror1

# Contract Aliases
SLICE := slice
GUESS_PUZZLE := guess_the_puzzle
ULTRAHONK := ultrahonk_soroban_contract

# WASM Paths
SLICE_WASM := target/wasm32v1-none/release/slice.optimized.wasm
GUESS_WASM := target/wasm32v1-none/release/guess_the_puzzle.optimized.wasm
HONK_WASM := target/wasm32v1-none/release/ultrahonk_soroban_contract.optimized.wasm

all: build optimize

# ==============================================================================
# Build & Optimize
# ==============================================================================

build:
	stellar contract build

optimize: build
	stellar contract optimize --wasm target/wasm32v1-none/release/slice.wasm
	stellar contract optimize --wasm target/wasm32v1-none/release/guess_the_puzzle.wasm
	stellar contract optimize --wasm target/wasm32v1-none/release/ultrahonk_soroban_contract.wasm

fmt:
	cargo fmt --all

clean:
	cargo clean
	rm -rf target/

# ==============================================================================
# Deployments
# ==============================================================================

# 1. Deploy the UltraHonk Verifier first (Dependencies)
deploy-honk: optimize
	stellar contract deploy \
		--wasm $(HONK_WASM) \
		--source $(SOURCE_ADMIN) \
		--network $(NETWORK) \
		--alias $(ULTRAHONK)

# 2. Deploy Slice (Main Protocol)
# Constructor args: admin, min_vote_s, max_vote_s, min_deadline_s, max_deadline_s
deploy-slice: optimize
	stellar contract deploy \
		--wasm $(SLICE_WASM) \
		--source $(SOURCE_ADMIN) \
		--network $(NETWORK) \
		--alias $(SLICE) \
		-- \
		--admin $(ADMIN) \
		--min_vote_seconds 300 \
		--max_vote_seconds 86400 \
		--min_deadline_seconds 300 \
		--max_deadline_seconds 86400

# 3. Deploy Guess The Puzzle (Demo Game)
deploy-guess: optimize
	stellar contract deploy \
		--wasm $(GUESS_WASM) \
		--source $(SOURCE_ADMIN) \
		--network $(NETWORK) \
		--alias $(GUESS_PUZZLE) \
		-- \
		--admin $(ADMIN)

# ==============================================================================
# Slice Contract Interactions
# ==============================================================================

# Initialize a category (Required before creating disputes)
slice-add-category:
	stellar contract invoke \
		--source $(ADMIN) \
		--network $(NETWORK) \
		--id $(SLICE) \
		-- \
		add_category \
		--name "General"

# Create a Dispute
# Note: meta_hash is 32 bytes hex.
slice-create-dispute:
	stellar contract invoke \
		--source $(ADMIN) \
		--network $(NETWORK) \
		--id $(SLICE) \
		-- \
		create_dispute \
		--claimer $(CLAIMER) \
		--defender $(DEFENDER) \
		--meta_hash 0000000000000000000000000000000000000000000000000000000000000001 \
		--min_amount 100 \
		--max_amount 1000 \
		--category "General" \
		--allowed_jurors "None" \
		--jurors_required 5 \
		--pay_deadline_seconds 3600 \
		--vote_deadline_seconds 3600

# Pay Dispute (Claimer pays into escrow)
slice-pay-claimer:
	stellar contract invoke \
		--source $(CLAIMER) \
		--network $(NETWORK) \
		--id $(SLICE) \
		-- \
		pay_dispute \
		--caller $(CLAIMER) \
		--dispute_id 1 \
		--amount 500

# Pay Dispute (Defender pays into escrow)
slice-pay-defender:
	stellar contract invoke \
		--source $(DEFENDER) \
		--network $(NETWORK) \
		--id $(SLICE) \
		-- \
		pay_dispute \
		--caller $(DEFENDER) \
		--dispute_id 1 \
		--amount 500

# Juror Stakes to be assigned to the dispute
slice-assign-juror:
	stellar contract invoke \
		--source $(JUROR) \
		--network $(NETWORK) \
		--id $(SLICE) \
		-- \
		assign_dispute \
		--caller $(JUROR) \
		--category "General" \
		--stake_amount 200

# Juror Submits Vote (Requires ZK Proof Blob)
# Note: proof and public_inputs must be hex bytes. Using dummy data for CLI example.
slice-submit-vote:
	stellar contract invoke \
		--source $(JUROR) \
		--network $(NETWORK) \
		--id $(SLICE) \
		-- \
		submit_vote \
		--caller $(JUROR) \
		--dispute_id 1 \
		--proof dede \
		--public_inputs dede

# Execute Tally (Finalize Dispute)
slice-execute:
	stellar contract invoke \
		--source $(ADMIN) \
		--network $(NETWORK) \
		--id $(SLICE) \
		-- \
		execute \
		--dispute_id 1 \
		--tally_proof dede \
		--tally_public_inputs dede

# Get Dispute Details
slice-get-dispute:
	stellar contract invoke \
		--source $(ADMIN) \
		--network $(NETWORK) \
		--id $(SLICE) \
		-- \
		get_dispute \
		--dispute_id 1

# ==============================================================================
# Guess The Puzzle Interactions
# ==============================================================================

# Add funds to the prize pot
guess-add-funds:
	stellar contract invoke \
		--source $(ADMIN) \
		--network $(NETWORK) \
		--id $(GUESS_PUZZLE) \
		-- \
		add_funds \
		--funder $(ADMIN) \
		--amount 100

# View the prize pot balance
guess-prize-pot:
	stellar contract invoke \
		--source $(ADMIN) \
		--network $(NETWORK) \
		--id $(GUESS_PUZZLE) \
		-- \
		prize_pot

# Set a new puzzle (Admin only)
guess-set-puzzle:
	stellar contract invoke \
		--source $(ADMIN) \
		--network $(NETWORK) \
		--id $(GUESS_PUZZLE) \
		-- \
		set_puzzle \
		--puzzle 123456

# Verify Puzzle
# Note: vk_json and proof_blob are bytes. This usually requires a script to handle large hex inputs.
# This command is a placeholder for the signature.
guess-verify:
	stellar contract invoke \
		--source $(CLAIMER) \
		--network $(NETWORK) \
		--id $(GUESS_PUZZLE) \
		-- \
		verify_puzzle \
		--guesser $(CLAIMER) \
		--vk_json 00 \
		--proof_blob 00


# ==============================================================================
# End-to-End (E2E) Demo Flow
# ==============================================================================

.PHONY: e2e-demo

e2e-demo:
	@echo "======================================================="
	@echo ">>> STEP 1: DEPLOYING CONTRACTS"
	@echo "======================================================="
	$(MAKE) deploy-honk
	$(MAKE) deploy-slice

	@echo "\n======================================================="
	@echo ">>> STEP 2: INITIALIZING PROTOCOL"
	@echo "======================================================="
	@echo "--> Adding 'General' category..."
	$(MAKE) slice-add-category

	@echo "\n======================================================="
	@echo ">>> STEP 3: CREATING DISPUTE"
	@echo "======================================================="
	@echo "--> Creating Dispute #1 (Claimer vs Defender)..."
	$(MAKE) slice-create-dispute

	@echo "\n======================================================="
	@echo ">>> STEP 4: FUNDING PHASE"
	@echo "======================================================="
	@echo "--> Claimer paying 500 stake..."
	$(MAKE) slice-pay-claimer
	@echo "--> Defender paying 500 stake..."
	$(MAKE) slice-pay-defender

	@echo "\n======================================================="
	@echo ">>> STEP 5: JUROR ASSIGNMENT"
	@echo "======================================================="
	@echo "--> Juror1 staking 200 to join the case..."
	$(MAKE) slice-assign-juror

	@echo "\n======================================================="
	@echo ">>> STEP 6: VOTING (SIMULATED)"
	@echo "======================================================="
	@echo "--> Submitting vote with mock proof..."
	@echo "(Note: This transaction may fail on-chain if the ZK proof is invalid)"
	# We use '-' to ignore errors here because we are passing mock hex data
	# instead of a real Noir generated proof in this Make macro.
	-$(MAKE) slice-submit-vote

	@echo "\n======================================================="
	@echo ">>> STEP 7: EXECUTION"
	@echo "======================================================="
	@echo "--> Executing final ruling..."
	-$(MAKE) slice-execute

	@echo "\n======================================================="
	@echo ">>> E2E FLOW COMPLETE"
	@echo "======================================================="
