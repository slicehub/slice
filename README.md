# Slice

**Dispute resolution for the modern web.**

Slice is a gamified dispute resolution system built on Stellar. It enables platforms to resolve small disputes in minutes, not days, with impartial jurors, transparent decisions, and instant execution.

---

## Problem Statement

The digital economy is increasingly dominated by microtransactions. But when things go wrong—failed deliveries, poor-quality work, withheld payments, or unfulfilled agreements—users don't have a fast, impartial, or accessible way to resolve these small disputes.

Current systems are slow, centralized, and arbitrary:

- Companies act as both judge and jury
- Users don't feel transparency
- A simple case can take days or weeks
- There's no open, neutral mechanism that works for small transactions

**A study by Lemon Cash—one of Argentina's largest cryptocurrency exchanges with over 2 million users—showed that 80% of users would rather abandon the app than initiate a small claim.**

This problem persists even within the Stellar ecosystem. Despite having wallets, anchors, exchanges, remittance platforms, on/off-ramps, marketplaces, and payment tools, **there's still no native solution for impartial, programmable dispute resolution.**

Other blockchains have alternatives like Kleros, but they're slow, expensive, hard to use, and not designed for the speed, simplicity, and accessibility that defines Stellar.

---

## Solution Overview

Slice leverages game theory, cryptographic verification, and Stellar's infrastructure to provide:

- **Fast resolution**: Decisions in minutes, not days
- **Gamified experience**: Jurors vote in an intuitive app, not a complex crypto interface
- **Maximum 3 rounds**: No endless appeals
- **Instant scalability**: Each round scales automatically
- **Zero friction**: No crypto complexity for end users

Kleros proved that decentralized dispute resolution works. But it also showed its limits: slow processes, long rounds, disconnected jurors, and an unintuitive experience for real users.

We studied each of those weaknesses... and solved them with a proposal designed for the modern world.

---

## Why Stellar?

Stellar's infrastructure enables Slice to work **fast, cheap, and globally**:

- **Stellar Network**: Instant payments in USDC/XLM; minimal fees → ideal for micro-disputes
- **Anchors**: On/off-ramps that allow dispute payments to settle in local currency
- **Stablecoins (USDC)**: Clear disputes on stable values, without volatility
- **Soroban**: Dispute registry, verifiable randomness for juror selection, evidence hashing, and automatic award execution
- **Wallets (Privy + Stellar)**: Simple onboarding, custodial-like UX, no friction for non-crypto users

Stellar offers the perfect combination of **speed, low costs, stability, and programmability** for a global light justice system.

---

## Architecture

### Frontend

- React with TypeScript
- Vite for build tooling
- Stellar Design System for UI components
- React Router for navigation
- Lottie for animations

### Smart Contracts

- **Soroban**: Core dispute logic, fund escrow, juror selection
- **Noir + Ultrahonk**: Zero-knowledge proofs for voting privacy and verification

### Key Features (MVP)

1. **Dispute initiation + on-chain deposit**: Users lock funds in a Soroban contract
2. **Random juror selection**: Verifiable selection using Soroban
3. **Round 1 voting**: Jurors receive evidence and vote in the mini-app
4. **Automatic dispute resolution**: Contract releases funds according to the final decision

---

## Getting Started

This guide will help you set up the Slice repository from scratch.

### Prerequisites

- **Node.js** (v18 or higher) and **bun**
- **Rust** (latest stable version) - [Install Rust](https://www.rust-lang.org/tools/install)
- **Stellar CLI** - Install via:

  ```bash
  bun install -g @stellar/cli
  ```

### Step 1: Clone the Repository

```bash
git clone https://github.com/slicehub/slice.git
cd slice
```

### Step 2: Install Dependencies

```bash
bun install
```

### Step 3: Install and Build Contracts

```bash
bun run install:contracts
```

This command will:

- Compile Rust contracts
- Deploy them to your local Stellar container
- Generate TypeScript bindings

### Step 4: Start Local Stellar Network

```bash
# Start Quickstart (stellar-core + RPC + Horizon + Friendbot) in a container
stellar container start local --limits unlimited
```

The `--limits unlimited` preset sets Stellar smart contract resource limits to their maximum values for local mode.

Quickstart's local mode exposes RPC on `http://localhost:8000` and includes a Friendbot faucet by default.

### Step 5: Configure Environment

The project uses `environments.toml` for network configuration. By default, it's configured for Testnet. To use local mode, uncomment the local network section in `environments.toml`:

```toml
[development.network]
rpc-url = "http://localhost:8000/rpc"
network-passphrase = "Standalone Network ; February 2017"
run-locally = true
```

### Step 6: Start Development Server

```bash
bun run dev
```

This will:

- Watch for contract changes and automatically recompile
- Regenerate TypeScript bindings on contract updates
- Start the Vite dev server with hot-reloading

The app will be available at `http://localhost:5173` (or the port shown in the terminal).

---

## Development Workflow

### The Golden Loop

When making changes to smart contracts:

1. **Modify** `contracts/slice/src/lib.rs` (or other contract files)
2. **Run** `bun run install:contracts` to recompile and regenerate TypeScript bindings
3. **Update** frontend code importing from `@/contracts/slice` or `src/contracts/slice.ts`

Scaffold Stellar watches for changes and handles redeployment automatically during `bun run dev`.

### Available Scripts

- `bun run dev`: Start development server with contract watching
- `bun run build`: Build the production bundle
- `bun run install:contracts`: Compile contracts and generate TypeScript bindings
- `bun run lint`: Run ESLint
- `bun run format`: Format code with Prettier
- `bun run preview`: Preview production build

### Testing Contracts

```bash
cargo test -p slice
```

---

## Project Structure

```text
slice/
├── contracts/              # Soroban smart contracts (Rust)
│   ├── slice/             # Main dispute resolution contract
│   └── ultrahonk-soroban-contract/  # ZK verification contract
├── circuits/              # Noir circuits for zero-knowledge proofs
│   ├── reveal/           # Vote reveal circuit
│   └── tally/            # Vote tally circuit
├── packages/              # Auto-generated contract TypeScript bindings
├── public/                # Static assets
│   ├── images/           # Images and icons
│   └── animations/       # Video and Lottie animations
├── src/
│   ├── components/       # React components
│   │   ├── disputes/    # Dispute-related components
│   │   ├── claimant-evidence/  # Evidence display components
│   │   └── dispute-overview/   # Dispute overview components
│   ├── pages/           # Page components (routes)
│   ├── hooks/           # Custom React hooks
│   ├── services/        # Business logic services
│   ├── contracts/       # Contract utilities and types
│   └── util/            # Utility functions
├── environments.toml     # Stellar network configuration
└── vite.config.ts       # Vite configuration
```

---

## Key Features

### Dispute Flow

1. **Create Dispute**: User initiates a dispute and locks funds
2. **View Evidence**: Browse claimant and defendant evidence (images, videos, documents)
3. **Vote**: Jurors vote on the dispute outcome
4. **Resolve**: Automatic fund distribution based on the verdict
5. **Success Animation**: Celebration animation on successful vote submission

### Evidence Types

- Images (PNG, JPG)
- Videos (MP4)
- Audio files
- PDF documents (with preview)

---

## Team

- **Tomas Salina** – FullStack Developer (+5 years)
- **Steven Molina** – Blockchain Developer (+3 years)
- **Renzo Barcos** – FullStack Developer (+3 years)
- **Micaela Descotte** – UX/UI Designer (+5 years)

---

## Links

- **GitHub**: <https://github.com/slicehub/slice>
- **Stellar Scaffold**: <http://scaffoldstellar.org>

---

## Security

Slice uses proven game theory mechanisms:

- Jurors with aligned incentives
- Selection impossible to manipulate using VRF + ZK
- Dynamic reputation
- Anti-bot defenses that make dishonest voting economically irrational

---

## Contributing

This is an active project. Contributions are welcome! Please ensure:

- Code follows the existing style (ESLint + Prettier)
- Contracts are properly tested
- TypeScript types are maintained
- Documentation is updated

---

## License

See [LICENSE](LICENSE) file for details.

---

**Slice**: Justice that's fast, fair, and built for the modern web.
