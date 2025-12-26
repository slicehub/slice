"use client";

import { useState } from "react";
import { Contract, parseUnits, isAddress } from "ethers";
import { toast } from "sonner";
import { erc20Abi } from "@/contracts/erc20-abi";
import { useSmartWallet } from "@/hooks/useSmartWallet";
import { getContractsForChain } from "@/config/contracts";

export function useSendFunds(onSuccess?: () => void) {
  const { signer, chainId } = useSmartWallet();
  const [isLoading, setIsLoading] = useState(false);

  const sendFunds = async (recipient: string, amount: string) => {
    // Basic Validation
    if (!signer) {
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
      // 1. Get Config (Works for both environments automatically)
      const { usdcToken } = getContractsForChain(chainId);

      // 2. Create Contract (Same interface for everyone)
      const tokenContract = new Contract(usdcToken, erc20Abi, signer);
      const decimals = await tokenContract.decimals();
      const value = parseUnits(amount, decimals);

      // 3. Execute (One method for all)
      toast.info("Sending transaction...");

      // Optional: Manual Gas Estimation (Good practice for robustness)
      try {
        const estimatedGas = await tokenContract.transfer.estimateGas(recipient, value);
        // Add 20% buffer
        const gasLimit = (estimatedGas * BigInt(120)) / BigInt(100);
        const tx = await tokenContract.transfer(recipient, value, { gasLimit });

        // 4. Wait
        await tx.wait();
        toast.success("Transfer successful!");
        onSuccess?.();
      } catch (estimateError: any) {
        console.warn("Gas estimation failed, trying fallback...", estimateError);
        // Fallback to sending without explicit gas limit or a safe default if needed
        const tx = await tokenContract.transfer(recipient, value);
        await tx.wait();
        toast.success("Transfer successful!");
        onSuccess?.();
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.reason || err.message || "Transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  return { sendFunds, isLoading };
}

