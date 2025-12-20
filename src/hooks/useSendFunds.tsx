"use client";

import { useState, useEffect } from "react";
import { parseUnits, isAddress, Contract } from "ethers";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { erc20Abi } from "viem";
import { toast } from "sonner";
import { getContractsForChain } from "@/config/contracts";
import { DEFAULT_CHAIN } from "@/config/chains";
import { useEmbedded } from "@/providers/EmbeddedProvider";
import { useXOContracts } from "@/providers/XOContractsProvider";

export function useSendFunds(onSuccess?: () => void) {
  // --- 1. Contexts & State ---
  const { isEmbedded } = useEmbedded();
  const { signer } = useXOContracts();
  const { chainId: wagmiChainId } = useAccount();

  // Wagmi Hooks
  const {
    data: hash,
    writeContract,
    isPending: isWagmiPending,
    error: wagmiError,
  } = useWriteContract();
  const { isLoading: isWagmiConfirming, isSuccess: isWagmiConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Embedded State
  const [isEmbeddedLoading, setIsEmbeddedLoading] = useState(false);

  // Unified Loading State
  const isLoading = isEmbedded
    ? isEmbeddedLoading
    : isWagmiPending || isWagmiConfirming;

  // --- 2. Side Effects ---

  // Handle Wagmi Success
  useEffect(() => {
    if (isWagmiConfirmed) {
      toast.success("Transfer successful!");
      onSuccess?.();
    }
  }, [isWagmiConfirmed, onSuccess]);

  // Handle Wagmi Errors
  useEffect(() => {
    if (wagmiError) {
      toast.error(wagmiError.message || "Transaction failed");
    }
  }, [wagmiError]);

  // --- 3. The Send Function ---
  const sendFunds = async (recipient: string, amount: string) => {
    // Basic Validation
    if (!isAddress(recipient)) {
      toast.error("Invalid recipient address");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Invalid amount");
      return;
    }

    try {
      const value = parseUnits(amount, 6); // USDC has 6 decimals
      // Determine active chain ID (Default to Base Sepolia 84532 if undefined)
      // Determine active chain ID
      const activeChainId = isEmbedded ? DEFAULT_CHAIN.chain.id : wagmiChainId || DEFAULT_CHAIN.chain.id;
      const { usdcToken } = getContractsForChain(activeChainId);

      if (isEmbedded) {
        // --- PATH A: Embedded (Ethers.js) ---
        if (!signer) {
          toast.error("Wallet not ready");
          return;
        }

        setIsEmbeddedLoading(true);
        try {
          // Cast ABI to any to avoid strict typing issues between viem/ethers
          const tokenContract = new Contract(
            usdcToken,
            erc20Abi as any,
            signer,
          );

          toast.info("Sending transaction...");
          const tx = await tokenContract.transfer(recipient, value);

          toast.info("Waiting for confirmation...");
          await tx.wait();

          toast.success("Transfer successful!");
          onSuccess?.();
        } catch (err: any) {
          console.error("Embedded Send Error:", err);
          const detailedError = err.reason || err.shortMessage || err.message || JSON.stringify(err);
          toast.error(`Transfer Failed: ${detailedError}`);
        } finally {
          setIsEmbeddedLoading(false);
        }
      } else {
        // --- PATH B: Standard (Wagmi) ---
        writeContract({
          address: usdcToken as `0x${string}`,
          abi: erc20Abi,
          functionName: "transfer",
          args: [recipient as `0x${string}`, value],
        });
      }
    } catch (err) {
      console.error("Preparation Error:", err);
      toast.error("Failed to prepare transaction");
      setIsEmbeddedLoading(false);
    }
  };

  return {
    sendFunds,
    isLoading,
  };
}
