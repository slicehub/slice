# ⚖️ Slice Protocol Application

This project is the frontend implementation for **Slice**, a **neutral, on-chain dispute resolution protocol** built on Next.js. It features a **multi-tenant architecture** capable of running as a standalone PWA or as an embedded MiniApp across various wallet ecosystems (Base, Farcaster, Lemon, Beexo).

**🔗 Live Demo**: [Testnet](https://dev.slicehub.xyz) | [Mainnet](https://app.slicehub.xyz)

---

## What is Slice?

**Slice** is a **decentralized dispute resolution protocol** for smart contracts and dApps. It acts as a **neutral truth oracle** that resolves disputes through **randomly selected jurors**, **private voting**, and **on-chain verification**.

Slice ensures a trustless, verifiable, and economically secure ruling (Party A or Party B) that external protocols can rely on and execute.

---

## 🏗️ Architecture: Multi-Tenant & Strategy Pattern

This application uses a **Strategy Pattern** to manage wallet connections and SDK interactions. Instead of a single monolithic connection logic, we use an abstraction layer that selects the appropriate **Adapter** based on the runtime environment (detected via subdomains and SDK presence).

### 1. Connection Strategies
We support three distinct connection strategies:

| Strategy | Description | Used By |
| :--- | :--- | :--- |
| **Wagmi SW** | Uses Smart Wallets (Coinbase/Safe) via Privy & Wagmi. | **PWA**, **Base**, **Farcaster** |
| **Wagmi EOA** | Uses standard Injected (EOA) connectors. | **Beexo** |
| **Lemon SDK** | Uses the native `@lemoncash/mini-app-sdk`. | **Lemon** |

### 2. Supported MiniApps & Environments
The application behaves differently depending on the access point (Subdomain) and injected providers.

| Platform | Subdomain | Connection Strategy | Auth Type |
| :--- | :--- | :--- | :--- |
| **Standard PWA** | `app.` | **Wagmi SW** | Social / Email / Wallet |
| **Base MiniApp** | `base.` | **Wagmi SW** | Coinbase Smart Wallet |
| **Farcaster** | `frames.` | **Wagmi SW** | Farcaster Identity |
| **Beexo** | `beexo.` | **Wagmi EOA** | Injected Provider (Beexo) |
| **Lemon** | `lemon.` | **Lemon SDK** | Native Lemon Auth |

---

## 🚀 Try Slice Now

Experience Slice in action across our supported networks:

- **Testnet Demo**: [dev.slicehub.xyz](https://dev.slicehub.xyz) - (Base Sepolia / Scroll Sepolia)
- **Mainnet App**: [app.slicehub.xyz](https://app.slicehub.xyz) - (Base / Scroll)

---

## How Slice Works

1. **Create Dispute**: External contract calls `createDispute(...)` with the dispute details.
2. **Juror Selection**: Slice randomly selects jurors from a staked pool using **verifiable randomness (VRF)**.
3. **Private Voting**: Jurors commit votes privately using a hash (`hash(vote_option + secret)`).
4. **Reveal & Verification**: Jurors reveal their vote and secret to verify their commitment. Only revealed votes are counted.
5. **Final Ruling**: Slice aggregates votes and publishes the result on-chain.
6. **Execution**: External protocols execute based on the ruling.

---

## Integration Guide (For Developers)

Integrating Slice into your protocol is as simple as 1-2-3:

1.  **Create a Dispute:**
    Call `slice.createDispute(defender, category, ipfsHash, jurorsRequired)` from your contract.
2.  **Wait for Ruling:**
    Slice handles the juror selection, voting, and consensus off-chain and on-chain.
3.  **Read the Verdict:**
    Once the dispute status is `Executed`, read the `winner` address from the `disputes` mapping and execute your logic.

---

## Deployed Contracts

| Network            | Slice Core                                   | USDC Token                                   |
| ------------------ | -------------------------------------------- | -------------------------------------------- |
| **Base Sepolia** | `0xD8A10bD25e0E5dAD717372fA0C66d3a59a425e4D` | `0x5dEaC602762362FE5f135FA5904351916053cF70` |
| **Scroll Sepolia** | `0x095815CDcf46160E4A25127A797D33A9daF39Ec0` | `0x2C9678042D52B97D27f2bD2947F7111d93F3dD0D` |
| **Base** | `0xD8A10bD25e0E5dAD717372fA0C66d3a59a425e4D` | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| **Scroll** | `0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4` | `0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4` |

---

## Getting Started

1.  **Configure Environment:**
    Rename `.env.example` to `.env.local` and add your keys. Note that specific strategies (like Lemon) may require additional variables if running locally.

    ```bash
    NEXT_PUBLIC_APP_ENV="development" # or 'production'

    # Pinata / IPFS Config
    NEXT_PUBLIC_PINATA_JWT="your_pinata_jwt"
    NEXT_PUBLIC_PINATA_GATEWAY_URL="your_gateway_url"

    # Privy Config (For PWA/Base/Farcaster)
    NEXT_PUBLIC_PRIVY_APP_ID="your_privy_app_id"
    NEXT_PUBLIC_PRIVY_CLIENT_ID="your_privy_client_id"
    
    # Contracts
    NEXT_PUBLIC_BASE_SLICE_CONTRACT="0x..."
    NEXT_PUBLIC_BASE_USDC_CONTRACT="0x..."
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Run Development Server:**

    ```bash
    pnpm run dev
    ```

    * **PWA Mode:** Open `http://localhost:3000`
    * **Lemon Mode:** Use a tunnel or specific port configuration to simulate the Lemon environment if needed, or set `NEXT_PUBLIC_FORCE_STRATEGY="lemon"` for UI testing.

---

## ⚙️ Application Configuration

The `src/config/` and `src/adapters/` directories manage the multi-environment logic.

### Abstraction Layer (`src/adapters/`)
We abstract wallet interactions behind a common interface. The app does not know *which* wallet provider is active, only that it can `connect`, `sign`, and `sendTransaction`.

* **`useWalletAdapter`**: The hook that determines the active strategy based on the subdomain or window object.
* **`LemonAdapter`**: Wraps `@lemoncash/mini-app-sdk`.
* **`WagmiAdapter`**: Wraps standard Wagmi hooks (configured for either Smart Wallets or EOA).

### Chain Configuration (`src/config/chains.ts`)
* Exports `SUPPORTED_CHAINS` mapping Wagmi `Chain` objects to contract addresses.
* Automatically defaults to the correct chain based on `NEXT_PUBLIC_APP_ENV`.

---

## Smart Contract Development

The `contracts/` directory contains the Solidity smart contracts, using **Hardhat** and **Viem**.

### Commands
* **Compile:** `npx hardhat compile`
* **Test:** `npx hardhat test`
* **Deploy:** `npx hardhat run scripts/deploy.ts --network baseSepolia`

---

## 🗺️ Roadmap

- [x] **Phase 1: Foundation** (Core Protocol, Web UI)
- [x] **Phase 2: Architecture Overhaul** (Strategy Pattern, Multi-Tenant SDKs)
- [ ] **Phase 3: MiniApp Expansion** (Live integration with Lemon, Beexo, Farcaster)
- [ ] **Phase 4: Specialized Courts** (Vertical-Specific Courts)
- [ ] **Phase 5: DAO Governance** (Community-Driven Development)
