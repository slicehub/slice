import { SUPPORTED_CHAINS, DEFAULT_CHAIN } from "./chains";

export const getContractsForChain = (chainId: number) => {
  const config = SUPPORTED_CHAINS.find((c) => c.chain.id === chainId);

  if (!config) {
    console.warn(`Chain ID ${chainId} not found in config, using default.`);
    return {
      sliceContract: DEFAULT_CHAIN.contracts.slice,
      usdcToken: DEFAULT_CHAIN.contracts.usdc
    };
  }

  return {
    sliceContract: config.contracts.slice,
    usdcToken: config.contracts.usdc
  };
};
