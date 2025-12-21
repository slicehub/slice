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
import { useConnect } from "@/providers/ConnectProvider";

export function useSendFunds(onSuccess?: () => void) {
  // --- 1. Contexts & State ---
  const { isEmbedded } = useEmbedded();
  const { signer } = useConnect();
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

    if (isEmbedded) {
      if (!signer) {
        console.error("❌ Debug: Signer is null");
        return;
      }

      try {
        const value = parseUnits(amount, 6);
        // Determine active chain ID
        const activeChainId = DEFAULT_CHAIN.chain.id;
        const { usdcToken } = getContractsForChain(activeChainId);

        const tokenContract = new Contract(usdcToken, erc20Abi as any, signer);

        console.log("--- 🕵️ DEEP DEBUG START ---");

        // 1. INSPECT SIGNER & NETWORK
        const signerAddress = await signer.getAddress();
        const providerNetwork = await signer.provider?.getNetwork();
        console.log(`👤 Signer Address: ${signerAddress}`);
        console.log(`🌐 Provider Chain ID: ${providerNetwork?.chainId}`);

        // 2. CONSTRUCT TRANSACTION (Without Sending)
        console.log("🏗️ Populating Transaction...");
        const populatedTx = await tokenContract.transfer.populateTransaction(
          recipient,
          value,
        );

        // Log the RAW payload Ethers wants to send
        console.log(
          "📦 RAW TX PAYLOAD:",
          JSON.stringify(
            {
              to: populatedTx.to,
              from: populatedTx.from,
              data: populatedTx.data,
              chainId: populatedTx.chainId?.toString(),
              value: populatedTx.value?.toString(),
              type: populatedTx.type,
            },
            null,
            2,
          ),
        );

        // 3. CHECK FOR EIP-1559 COMPATIBILITY
        const feeData = await signer.provider?.getFeeData();
        console.log(
          "⛽ Chain Fee Data:",
          JSON.stringify(
            {
              gasPrice: feeData?.gasPrice?.toString(),
              maxFeePerGas: feeData?.maxFeePerGas?.toString(),
              maxPriorityFeePerGas: feeData?.maxPriorityFeePerGas?.toString(),
            },
            null,
            2,
          ),
        );

        // 4. MANUAL ESTIMATION (Raw Call)
        console.log("🧮 Attempting Raw Estimation...");
        try {
          const estimate = await signer.estimateGas(populatedTx);
          console.log(`✅ Raw Estimate Success: ${estimate.toString()}`);
          // Add buffer
          populatedTx.gasLimit = (estimate * BigInt(120)) / BigInt(100);
        } catch (estErr: any) {
          console.error("❌ Raw Estimate Failed:", estErr.message);
          // Fallback to see if it sends anyway
          populatedTx.gasLimit = BigInt(65000);
        }

        // 5. ATTEMPT SIGNING (The Moment of Truth)
        console.log("🚀 Sending Transaction...");
        
        const tx = await signer.sendTransaction(populatedTx);

        console.log("✅ Transaction Sent! Hash:", tx.hash);
        await tx.wait();
        toast.success("Transfer successful!");
        onSuccess?.();
      } catch (err: any) {
        console.error("💥 CRITICAL FAILURE:", err);
        console.log("Error Keys:", Object.keys(err));
        // Log inner errors which often hide the real reason
        if (err.info) console.log("Error Info:", err.info);
        if (err.error) console.log("Inner Error:", err.error);

        toast.error(`Debug Failed: ${err.message}`);
      } finally {
        console.log("--- 🕵️ DEEP DEBUG END ---");
        setIsEmbeddedLoading(false);
      }
    } else {
      // --- Standard Wagmi Logic ---
      try {
        const value = parseUnits(amount, 6);
        const activeChainId = wagmiChainId || DEFAULT_CHAIN.chain.id;
        const { usdcToken } = getContractsForChain(activeChainId);

        writeContract({
          address: usdcToken as `0x${string}`,
          abi: erc20Abi,
          functionName: "transfer",
          args: [recipient as `0x${string}`, value],
        });
      } catch (err) {
        console.error("Preparation Error:", err);
        toast.error("Failed to prepare transaction");
      }
    }
  };

  return {
    sendFunds,
    isLoading,
  };
}
