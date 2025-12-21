# ⚖️ Slice Protocol Application

This project is the frontend implementation for **Slice**, a **neutral, on-chain dispute resolution protocol** built on Next.js and integrated with **Privy** and **Wagmi**.

---

## What is Slice?

**Slice** is a **decentralized dispute resolution protocol** for smart contracts and dApps. It acts as a **neutral truth oracle** that resolves disputes through **randomly selected jurors**, **private voting**, and **on-chain verification**.

Slice ensures a trustless, verifiable, and economically secure ruling (Party A or Party B) that external protocols can rely on and execute.

---

## Why Slice?

When **human judgment** is needed in decentralized applications—such as resolving conflicts, ambiguities, or subjective decisions—**Slice** provides a reliable and on-chain mechanism. It removes the need for centralized moderators and uses blockchain's transparency and cryptographic security.

---

## How Slice Works

1. **Create Dispute**: External contract calls `createDispute(...)` with the dispute details.
2. **Juror Selection**: Slice randomly selects jurors from a staked pool using **verifiable randomness (VRF)**.
3. **Private Voting**: Jurors commit votes privately using a hash (`hash(vote_option + secret)`).
4. **Reveal & Verification**: Jurors reveal their vote and secret to verify their commitment. Only revealed votes are counted.
5. **Final Ruling**: Slice aggregates votes and publishes the result on-chain.
6. **Execution**: External protocols execute based on the ruling.

---

## Core Features

* **Neutrality**: Provides objective, on-chain decisions.
* **Random Juror Selection**: Ensures fairness and unpredictability.
* **Private Commit–Reveal Voting**: Prevents bribery or manipulation.
* **Economic Security**: Jurors stake tokens, earning rewards for honesty and risking penalties for dishonesty.
---

## Deployed Contracts

The protocol is currently deployed on the following networks.

| Network | Slice Core | USDC Token |
| --- | --- | --- |
| **Base Sepolia** | `0xD8A10bD25e0E5dAD717372fA0C66d3a59a425e4D` | `0x5dEaC602762362FE5f135FA5904351916053cF70` |
| **Scroll Sepolia** | `0x095815CDcf46160E4A25127A797D33A9daF39Ec0` | `0x2C9678042D52B97D27f2bD2947F7111d93F3dD0D` |
| **Base** | `0xD8A10bD25e0E5dAD717372fA0C66d3a59a425e4D` | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| **Scroll** | `0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4` | `0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4` |


## Environment & Connectivity

### 1\. 🛡️ Neutral & Trustless Rulings

Slice uses **Verifiable Random Functions (VRF)** to select jurors from a staked pool, ensuring no single party can influence the jury composition. The result is a simple, binary ruling (`Party A` or `Party B`) that is mathematically verifiable.

### 2\. 🗳️ Private Commit–Reveal Voting

To prevent bribery, collusion, and "copycat" voting, Slice implements a robust two-stage voting process:

  * **Commit Phase:** Jurors submit a hash of their vote + a secret salt (`keccak256(vote + salt)`). The vote remains hidden on-chain.
  * **Reveal Phase:** Jurors reveal their vote and salt. Slice verifies the hash matches the commitment. Only revealed votes are tallied.

### 3\. 🪙 Configurable Staking & Incentives

Slice is token-agnostic. Each deployment can configure its own **staking token** (e.g., USDC, stablecoins, or governance tokens).

  * **Staking:** Jurors stake tokens to gain eligibility. Higher stake = higher selection probability.
  * **Rewards:** Jurors who vote with the majority are rewarded.
  * **Slashing:** Jurors who vote against the majority (incoherent) lose a portion of their stake, incentivizing honest consensus.

1. Go to [Reown Dashboard](https://dashboard.reown.com) and create a new project.
2. Copy your `Project ID`.
3. Rename `.env.example` to `.env.local` and paste env variables.
```.env.local
  NEXT_PUBLIC_PROJECT_ID="YOUR_PROJECT_ID"
  # Set the environment (will default to development/Testnet if omitted)
  # NEXT_PUBLIC_APP_ENV=production 
```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Configure Environment:**
    Rename `.env.example` to `.env.local` and add your keys:

    ```bash
    NEXT_PUBLIC_PROJECT_ID="YOUR_REOWN_PROJECT_ID"
    NEXT_PUBLIC_APP_ENV="development" # or 'production' for Mainnet

    # Pinata / IPFS Config
    NEXT_PUBLIC_PINATA_JWT="your_pinata_jwt"
    NEXT_PUBLIC_PINATA_GATEWAY_URL="your_gateway_url"
    ```

4.  **Run Development Server:**

    ```bash
    pnpm run dev
    ```

    Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) to launch the Slice App.

-----

## 🧩 Integration Guide (For Developers)

Integrating Slice into your protocol is as simple as 1-2-3:

1.  **Create a Dispute:**
    Call `slice.createDispute(defender, category, ipfsHash, jurorsRequired)` from your contract.
2.  **Wait for Ruling:**
    Slice handles the juror selection, voting, and consensus off-chain and on-chain.
3.  **Read the Verdict:**
    Once the dispute status is `Executed`, read the `winner` address from the `disputes` mapping and execute your logic (e.g., release escrow funds).

-----

## 🗺️ Roadmap

  * [x] **Phase 1: Foundation** (Core Contracts, Basic UI, Commit-Reveal)
  * [ ] **Phase 2: Expansion** (Arbitration Standards, Multiple Court Verticals)
  * [ ] **Phase 3: Decentralization** (DAO Governance, Permissionless Court Creation)
  * [ ] **Phase 4: Ecosystem** (SDKs for easy integration with major DeFi/Gig platforms)

-----
