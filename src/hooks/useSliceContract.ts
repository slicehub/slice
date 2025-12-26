"use client";

import { useMemo } from "react";
import { Contract } from "ethers";
import { getContractsForChain } from "@/config/contracts";
import { sliceAbi } from "@/contracts/slice-abi";
import { useSmartWallet } from "@/hooks/useSmartWallet";

export function useSliceContract() {
  const { signer, chainId } = useSmartWallet();

  const contract = useMemo(() => {
    // Get the correct address for the current chain
    const { sliceContract: sliceAddress } = getContractsForChain(chainId);

    // Validation: We need the Address AND the Signer
    if (!sliceAddress || !signer) {
      return null;
    }

    try {
      // Create the contract instance with the Signer (Write access)
      return new Contract(sliceAddress, sliceAbi, signer);
    } catch (error) {
      console.error("Failed to create Slice contract instance:", error);
      return null;
    }
  }, [signer, chainId]);

  return contract;
}
