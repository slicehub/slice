import { useMemo } from "react";
import { Contract } from "ethers";
import { useXOContracts } from "@/providers/XOContractsProvider";
import { sliceAbi } from "@/contracts/slice-abi";
import { useChainId } from "wagmi";
import { getContractsForChain } from "@/config/contracts"; // Import your new map

export function useSliceContract() {
  const { signer } = useXOContracts();
  const chainId = useChainId(); // Get current connected chain

  const contract = useMemo(() => {
    if (!signer) return null;

    // Dynamically grab the address for the current chain
    const { sliceContract } = getContractsForChain(chainId);

    if (!sliceContract) return null;
    return new Contract(sliceContract, sliceAbi, signer);
  }, [signer, chainId]);

  return contract;
}
