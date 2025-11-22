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


fund-accounts:
	@echo "======================================================="
	@echo ">>> FUNDING ACCOUNTS"
	@echo "======================================================="
	@for act in $(ADMIN) $(CLAIMER) $(DEFENDER) $(JUROR); do \
		addr=$$(stellar keys address $$act); \
		echo "Funding $$act ($$addr)..."; \
		curl -sf "http://localhost:8000/friendbot?addr=$$addr" > /dev/null || echo "Error funding $$act"; \
	done

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
# Constructor args: admin, min_pay_s, max_pay_s, min_commit_s, max_commit_s, min_reveal_s, max_reveal_s
deploy-slice: optimize
	stellar contract deploy \
		--wasm $(SLICE_WASM) \
		--source $(SOURCE_ADMIN) \
		--network $(NETWORK) \
		--alias $(SLICE) \
		-- \
		--admin $(ADMIN) \
		--min_pay_seconds 300 \
		--max_pay_seconds 86400 \
		--min_commit_seconds 300 \
		--max_commit_seconds 86400 \
		--min_reveal_seconds 300 \
		--max_reveal_seconds 86400

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
		--jurors_required 5 \
		--limits '{"pay_seconds": 3600, "commit_seconds": 3600, "reveal_seconds": 3600}'

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

# ---------------------------------------------------------
# Voting Phase
# ---------------------------------------------------------

# 1. Commit Vote (Hash of vote + salt)
# Note: commitment is a 32-byte hex string (SHA256 of vote + salt)
# Example commitment for vote=0, salt=...
slice-commit-vote:
	stellar contract invoke \
		--source $(JUROR) \
		--network $(NETWORK) \
		--id $(SLICE) \
		-- \
		commit_vote \
		--caller $(JUROR) \
		--dispute_id 1 \
		--commitment 2158a8906d5e2c2be001bac943ab9cab4063536e1c546b40221fdf8db031a4bb

# 2. Reveal Vote (Requires ZK Proof Blob)
# Note: vk_json and proof_blob must be hex bytes.
slice-reveal-vote:
	stellar contract invoke \
		--source $(JUROR) \
		--network $(NETWORK) \
		--id $(SLICE) \
		-- \
		reveal_vote \
		--caller $(JUROR) \
		--dispute_id 1 \
		--vote 0 \
		--salt 0000000000000000000000000000000000000000000000000000000000000000 \
		--vk_json dede \
		--proof_blob dede

# Execute Tally (Finalize Dispute)
slice-execute:
	stellar contract invoke \
		--source $(ADMIN) \
		--network $(NETWORK) \
		--id $(SLICE) \
		-- \
		execute \
		--dispute_id 1

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

e2e-demo: fund-accounts
	@echo "\n======================================================="
	@echo ">>> STEP 1: DEPLOYING CONTRACTS"
	@echo "======================================================="
	$(MAKE) deploy-honk
	$(MAKE) deploy-slice

	@echo "\n======================================================="
	@echo ">>> STEP 2: INITIALIZING PROTOCOL"
	@echo "======================================================="
	$(MAKE) slice-add-category

	@echo "\n======================================================="
	@echo ">>> STEP 3: CREATING DISPUTE"
	@echo "======================================================="
	$(MAKE) slice-create-dispute

	@echo "\n======================================================="
	@echo ">>> STEP 4: FUNDING PHASE"
	@echo "======================================================="
	$(MAKE) slice-pay-claimer
	$(MAKE) slice-pay-defender

	@echo "\n======================================================="
	@echo ">>> STEP 5: JUROR ASSIGNMENT"
	@echo "======================================================="
	$(MAKE) slice-assign-juror

	@echo "\n======================================================="
	@echo ">>> STEP 6: JUROR COMMIT"
	@echo "======================================================="
	$(MAKE) slice-commit-vote

	@echo "\n======================================================="
	@echo ">>> STEP 7: JUROR REVEAL"
	@echo "======================================================="
	-$(MAKE) slice-reveal-vote

	@echo "\n======================================================="
	@echo ">>> STEP 8: EXECUTION"
	@echo "======================================================="
	-$(MAKE) slice-execute
