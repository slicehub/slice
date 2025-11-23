# Repository Guidelines

## Project Structure & Module Organization

- Next.js App Router routes live in `src/app`, UI components (shadcn/ui) in `src/components/ui`, and hooks in `src/hooks`.
- The Slice Protocol core logic resides in `contracts/court/src/lib.rs`; this is the primary entry point for state and methods.
- Auto-generated TypeScript bindings are located in `src/contracts/court.ts` and `packages/*`; treat these as read-only artifacts that reflect the compiled Wasm.
- Configuration for deployments, including contract IDs and arguments, is managed in `environments.toml`.

## Slice Protocol Architecture

- **Core Data Model:** The `Dispute` struct tracks `id`, `status` (Voting, Revealing, Resolved), `juror_count`, `meta_hash` (IPFS), and `voting_end`.
- **Storage Layout:** Global counters use `DataKey::DisputeCount`; case data maps via `DataKey::JurorStake(Address)`; juror balances map via `DataKey::JurorStake(Address)`.
- **Juror Assignment Strategy (Juror-Centric):** To prevent jurors from waiting to be selected, assignment is inverted. Instead of a dispute randomly selecting a set of jurors upon creation, **jurors request work**, and the contract randomly assigns a pending dispute to them.
- **Implemented Logic:** `stake_as_juror` handles token transfers to the contract; `create_dispute` initializes case storage and increments the global counter.
- **Pending Logic:** Implementation of the random dispute-to-juror mapping (VRF/PRNG), Commit-Reveal voting patterns, and final ruling execution.

## Build, Test, and Development Commands

- `npm run dev`: runs the frontend with hot-reloading and watches for contract changes.
- `npm run install:contracts`: compiles Rust contracts, deploys them to the local container, and **regenerates TypeScript interfaces**; run this immediately after _any_ Rust change.
- `cargo test -p court`: runs unit tests specifically for the Slice court contract.
- `npm run lint` / `npm run format`: enforce ESLint and Prettier rules.

## Development Workflow

- **The Golden Loop:** Adhere to the strict modification order to avoid type errors:
  1.  Modify `contracts/court/src/lib.rs`.
  2.  Run `npm run install:contracts` to recompile Wasm and regenerate `src/contracts/`.
  3.  Implement UI changes importing the updated client (e.g., `import * as court from "@/contracts/court"`).
- **Validation:** Use `stellar scaffold watch` during development to catch binding desynchronization early.

## Coding Style & Naming Conventions

- **Frontend:** Use functional React components with `shadcn/ui` primitives. Access the user's wallet via `const { address } = useWallet()`.
- **Math:** Handle Stellar amounts as `BigInt` in TypeScript (standard 7-decimal precision) and `i128` in Rust; avoid floating-point math for token values.
- **Smart Contracts:** Always use `user.require_auth()` for state-changing actions associated with a specific address. Prefer `env.storage().instance()` for global configuration.

## Environment & Configuration Tips

- Keep the network set to `LOCAL` in `.env` for v1 development; this targets the standalone container defined in `environments.toml`.
- Mock the staking token or use the native token for local testing; ensure the Slice contract is initialized with the correct token address in the constructor arguments in `environments.toml`.
- Secrets and RPC credentials must remain in `.env`, excluded from git.
