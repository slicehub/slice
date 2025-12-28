"use client";

import { useState } from "react";
import {
  useWriteContract,
  usePublicClient,
  useAccount,
  useChainId,
} from "wagmi";
import { parseUnits, erc20Abi, isAddress } from "viem";
import { toast } from "sonner";
import { getContractsForChain } from "@/config/contracts";

export function useSendFunds(onSuccess?: () => void) {
  const { address } = useAccount(); // Check for wallet connection
  const chainId = useChainId(); // Get current chain ID

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(false);

  const sendFunds = async (recipient: string, amount: string) => {
    // Basic Validation
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }
    if (!isAddress(recipient)) {
      toast.error("Invalid recipient address");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Invalid amount");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Get Config
      const { usdcToken } = getContractsForChain(chainId);

      // 2. We need the decimals.
      // Option A: Hardcode to 6 (USDC standard).
      // Option B: Read it from contract.
      // Ethers code used: await tokenContract.decimals();
      // With Wagmi writeContract, we need to know args before calling.
      // Ideally we read decimals first.
      // For simplicity/speed in this hook, and since we know it's USDC, let's assume 6 or read it using publicClient.

      let decimals = 6;
      if (publicClient) {
        try {
          decimals = await publicClient.readContract({
            address: usdcToken as `0x${string}`,
            abi: erc20Abi,
            functionName: "decimals",
          });
        } catch (e) {
          console.warn("Failed to fetch decimals, defaulting to 6", e);
        }
      }

      const value = parseUnits(amount, decimals);

      toast.info("Sending transaction...");

      // 3. Execute
      const hash = await writeContractAsync({
        address: usdcToken as `0x${string}`,
        abi: erc20Abi,
        functionName: "transfer",
        args: [recipient as `0x${string}`, value],
      });

      // 4. Wait
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      toast.success("Transfer successful!");
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.reason || err.shortMessage || err.message || "Transaction failed",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return { sendFunds, isLoading };
}
