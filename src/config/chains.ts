import { baseSepolia, base } from "wagmi/chains";

import type { Chain } from "viem";

export type ChainConfig = {
  chain: Chain;
  contracts: {
    slice: string;
    usdc: string;
  };
};

// Centralized configuration list
export const SUPPORTED_CHAINS: ChainConfig[] = [
  // Base
  {
    chain: baseSepolia,
    contracts: {
      slice: process.env.NEXT_PUBLIC_BASE_SLICE_CONTRACT!,
      usdc: process.env.NEXT_PUBLIC_BASE_USDC_CONTRACT!,
    },
  },
  // {
  //   chain: base,
  //   contracts: {
  //     slice: process.env.NEXT_PUBLIC_BASE_SLICE_CONTRACT!,
  //     usdc: process.env.NEXT_PUBLIC_BASE_USDC_CONTRACT!,
  //   },
  // },
];

// Select Base Mainnet (8453) for Prod, Base Sepolia (84532) for Dev
const isProd = process.env.NEXT_PUBLIC_APP_ENV === "production";
// const defaultChainId = isProd ? base.id : baseSepolia.id;

const defaultChainId = baseSepolia.id; // We only use sepolia while in Beta

export const DEFAULT_CHAIN_CONFIG =
  SUPPORTED_CHAINS.find((c) => c.chain.id === defaultChainId) ||
  SUPPORTED_CHAINS[0];

export const activeChains = SUPPORTED_CHAINS.map((c) => c.chain) as [
  Chain,
  ...Chain[],
];

export const defaultChain = DEFAULT_CHAIN_CONFIG.chain;
export const DEFAULT_CHAIN = DEFAULT_CHAIN_CONFIG;
