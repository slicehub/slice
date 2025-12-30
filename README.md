# ⚖️ Slice Protocol Application

This project is the frontend implementation for **Slice**, a **neutral, on-chain dispute resolution protocol** built on Next.js and integrated with **Privy** and **Wagmi**.

**🔗 Live Demo**: [Testnet](https://dev.slicehub.xyz) | [Mainnet](https://app.slicehub.xyz)

---

## What is Slice?

**Slice** is a **decentralized dispute resolution protocol** for smart contracts and dApps. It acts as a **neutral truth oracle** that resolves disputes through **randomly selected jurors**, **private voting**, and **on-chain verification**.

Slice ensures a trustless, verifiable, and economically secure ruling (Party A or Party B) that external protocols can rely on and execute.

---

## Why Slice?

When **human judgment** is needed in decentralized applications—such as resolving conflicts, ambiguities, or subjective decisions—**Slice** provides a reliable and on-chain mechanism. It removes the need for centralized moderators and uses blockchain's transparency and cryptographic security.

---

## 🚀 Try Slice Now

Experience Slice in action before diving into the code:

- **Testnet Demo**: [dev.slicehub.xyz](https://dev.slicehub.xyz) - Try the protocol risk-free on Base Sepolia and Scroll Sepolia
- **Mainnet App**: [app.slicehub.xyz](https://app.slicehub.xyz) - Live production version on Base and Scroll mainnet

> **New to Slice?** Start with the testnet demo to explore dispute creation, juror voting, and the commit-reveal process without using real funds.

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

- **Neutrality**: Provides objective, on-chain decisions.
- **Random Juror Selection**: Ensures fairness and unpredictability.
- **Private Commit–Reveal Voting**: Prevents bribery or manipulation.
- **Economic Security**: Jurors stake tokens, earning rewards for honesty and risking penalties for dishonesty.

---

## Integration Guide (For Developers)

Integrating Slice into your protocol is as simple as 1-2-3:

1.  **Create a Dispute:**
    Call `slice.createDispute(defender, category, ipfsHash, jurorsRequired)` from your contract.
2.  **Wait for Ruling:**
    Slice handles the juror selection, voting, and consensus off-chain and on-chain.
3.  **Read the Verdict:**
    Once the dispute status is `Executed`, read the `winner` address from the `disputes` mapping and execute your logic (e.g., release escrow funds).

---

## Deployed Contracts

The protocol is currently deployed on the following networks.

| Network            | Slice Core                                   | USDC Token                                   |
| ------------------ | -------------------------------------------- | -------------------------------------------- |
| **Base Sepolia**   | `0xD8A10bD25e0E5dAD717372fA0C66d3a59a425e4D` | `0x5dEaC602762362FE5f135FA5904351916053cF70` |
| **Scroll Sepolia** | `0x095815CDcf46160E4A25127A797D33A9daF39Ec0` | `0x2C9678042D52B97D27f2bD2947F7111d93F3dD0D` |
| **Base**           | `0xD8A10bD25e0E5dAD717372fA0C66d3a59a425e4D` | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| **Scroll**         | `0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4` | `0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4` |

---

## Getting Started

1.  **Configure Environment:**
    Rename `.env.example` to `.env.local` and add your keys:

    ```bash
    NEXT_PUBLIC_APP_ENV="development" # or 'production' for Mainnet

    # Pinata / IPFS Config
    NEXT_PUBLIC_PINATA_JWT="your_pinata_jwt"
    NEXT_PUBLIC_PINATA_GATEWAY_URL="your_gateway_url"

    # Privy Config
    NEXT_PUBLIC_PRIVY_APP_ID="your_privy_app_id"
    NEXT_PUBLIC_PRIVY_CLIENT_ID="your_privy_client_id"
    NEXT_PUBLIC_PRIVY_JWKS_ENDPOINT="https://api.privy.io/v1/jwks"
    NEXT_PRIVY_SECRET="your_privy_secret"
    
    # Contracts
    NEXT_PUBLIC_APP_ENV="development"
    NEXT_PUBLIC_BASE_SLICE_CONTRACT="0xYourContractAddress"
    NEXT_PUBLIC_BASE_USDC_CONTRACT="0xYourUSDCContractAddress"
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Run Development Server:**

    ```bash
    pnpm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) to launch the Slice App.
  
---

## Embedded vs. Web Mode

The app supports two distinct runtime environments, controlled by `NEXT_PUBLIC_IS_EMBEDDED`:

1. **Web Mode (`false`)**:
* Uses **Privy** for authentication.
* Standard "Connect Wallet" flow.
* Best for desktop/mobile browsers.


2. **Embedded Mode (`true`)**:
* Uses **XO-Connect** (via `src/wagmi/xoConnector.ts`).
* Designed for running inside a parent wallet iframe.
* Automatically connects to the parent wallet context without UI prompts.


---

## Smart Contract Development (Hardhat) and Configuration

The `contracts/` directory contains the Solidity smart contracts. The project uses **Hardhat** with **Viem** for compilation and testing.

### Hardhat Setup

This project uses **Hardhat Configuration Variables** for secure secret management (instead of `.env` for private keys).

1. **Set your Deployer Private Key:**
```bash
npx hardhat vars set DEPLOYER_PRIVATE_KEY

```


2. **Set your RPC URL (e.g., Alchemy/Infura for Base Sepolia):**
```bash
npx hardhat vars set BASE_SEPOLIA_RPC_URL

```


### Available Commands

* **Compile Contracts:**
```bash
npx hardhat compile

```

* **Run Tests:**
```bash
npx hardhat test

```

* **Deploy (Example):**
You can run scripts located in `scripts/` (create one if needed):
```bash
npx hardhat run scripts/deploy.ts --network baseSepolia

```

### Contract Architecture

* **`Slice.sol`**: The core protocol logic handling dispute creation, juror selection (VRF), voting (commit/reveal), and ruling execution.
* **`MockUSDC.sol`**: A test token used for development on testnets to simulate staking.

### Staking Token

Slice is token-agnostic. Each deployment can configure its own **staking token** (e.g., USDC, stablecoins, or governance tokens).

- **Staking:** Jurors stake tokens to gain eligibility. Higher stake = higher selection probability.
- **Rewards:** Jurors who vote with the majority are rewarded.
- **Slashing:** Jurors who vote against the majority (incoherent) lose a portion of their stake, incentivizing honest consensus.

---

## ⚙️ Application Configuration

This project uses a centralized configuration strategy located in the `src/config/` directory to manage multi-chain support and environment switching.

### Directory Structure (`src/config/`)

* **`app.ts`**:
* Exports static constants for external services (Privy, Pinata).
* Determines if the app is running in **Embedded Mode** via `IS_EMBEDDED`.


* **`chains.ts`**:
* **Crucial File**: This is where supported networks are defined.
* It exports `SUPPORTED_CHAINS`, which maps Wagmi `Chain` objects to specific contract addresses (Slice & USDC).
* It automatically selects the default chain based on `NEXT_PUBLIC_APP_ENV`.


* **`contracts.ts`**:
* Exports `getContractsForChain(chainId)`.
* This utility dynamically returns the correct contract addresses based on the user's current network, allowing the UI to adapt if the user switches chains.


### Adding a New Chain

1. Open `src/config/chains.ts`.
2. Import the chain from `wagmi/chains` (e.g., `optimism`).
3. Add a new entry to the `SUPPORTED_CHAINS` array:

```typescript
{
  chain: optimism,
  contracts: {
    slice: "0x...", // Your deployed Slice contract
    usdc: "0x...",  // USDC on that chain
  },
}
```

---

## 🗺️ Roadmap

- [x] **Phase 1: Foundation** (Core Protocol, Web UI, Commit-Reveal Voting)
- [ ] **Phase 2: Expansion** (Additional Miniapps, Multi-chain Deployment, More Networks)
- [ ] **Phase 3: Developer Tools** (REST API, TypeScript SDK, Integration Libraries)
- [ ] **Phase 4: Specialized Courts** (Multiple Dispute Categories, Vertical-Specific Courts, Custom Arbitration Rules)
- [ ] **Phase 5: Ecosystem Growth** (DAO Governance, Permissionless Court Creation, Community-Driven Development)

---
