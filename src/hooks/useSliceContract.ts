"use client";

import { useMemo } from "react";
import { Contract } from "ethers";
import { useContracts } from "@/providers/ConnectProvider";
import { useChainId } from "wagmi";
import { getContractsForChain } from "@/config/contracts";
import { useEmbedded } from "@/providers/EmbeddedProvider";
import { DEFAULT_CHAIN } from "@/config/chains";
import { sliceAbi } from "@/contracts/slice-abi";

export function useSliceContract() {
  const { signer } = useContracts();
  const { isEmbedded } = useEmbedded();
  const wagmiChainId = useChainId();

  const contract = useMemo(() => {
    // 1. Fix: Use the correct chain ID logic
    const activeChainId = isEmbedded ? DEFAULT_CHAIN.chain.id : wagmiChainId;

    // Get the correct address for the current chain
    const { sliceContract: sliceAddress } = getContractsForChain(activeChainId);

    // 2. Validation: We need the Address AND the Signer
    if (!sliceAddress || !signer) {
      return null;
    }

    try {
      // 3. Create the contract instance with the Signer (Write access)
      return new Contract(sliceAddress, sliceAbi, signer);
    } catch (error) {
      console.error("Failed to create Slice contract instance:", error);
      return null;
    }
  }, [signer, wagmiChainId, isEmbedded]);

  return contract;
}
