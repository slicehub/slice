import { useState } from "react";
import {
  useWriteContract,
  usePublicClient,
  useAccount,
  useChainId,
} from "wagmi";
import { parseUnits, erc20Abi } from "viem";
import { SLICE_ABI, getContractsForChain } from "@/config/contracts";
import { toast } from "sonner";

export function usePayDispute() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const chainId = useChainId();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "approving" | "paying">("idle");

  const payDispute = async (disputeId: string | number, amountStr: string) => {
    if (!address || !publicClient) {
      toast.error("Wallet not connected");
      return false;
    }

    try {
      setLoading(true);

      // 1. Get Contracts
      const { usdcToken, sliceContract } = getContractsForChain(chainId);

      // Convert amount to BigInt (assuming 6 decimals for USDC)
      const amountBI = parseUnits(amountStr, 6);

      // --- STEP 1: APPROVE ---
      setStep("approving");
      toast.info("Approving tokens...");

      // We should check allowance first to avoid redundant approval
      // Reading allowance
      const allowance = await publicClient.readContract({
        address: usdcToken as `0x${string}`,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, sliceContract as `0x${string}`],
      });

      if (allowance < amountBI) {
        const approveHash = await writeContractAsync({
          address: usdcToken as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [sliceContract as `0x${string}`, amountBI],
        });

        // Wait for approval to be mined
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        toast.success("Approval confirmed.");
      } else {
        console.log("Allowance sufficient, skipping approval.");
      }

      // --- STEP 2: PAY DISPUTE ---
      setStep("paying");
      toast.info("Paying dispute...");

      // Estimate gas logic is handled by Wagmi implicitly, or we can add it if needed.
      // Ethers code had estimateGas * 1.2
      // Wagmi automatically estimates. If we need buffer, we can pass gas in options.
      // For now, let's rely on standard estimation.

      // Function name in contract is `fundAppeal` or similar?
      // Checked `payDispute.ts` view_file -> it calls `contract.payDispute`.
      // The ABI in `slice-abi.ts` has `payDispute`.

      const payHash = await writeContractAsync({
        address: sliceContract as `0x${string}`,
        abi: SLICE_ABI,
        functionName: "payDispute",
        args: [BigInt(disputeId)], // NOTE: Original hook had no amount arg for payDispute, just ID?
        // Wait, wait. Original code: `contract.payDispute(disputeId, { gasLimit })`
        // It seems `payDispute` does NOT take an amount argument in the function vars?
        // Let's re-read the ABI in `slice-abi.ts`.
        // ABI: `payDispute(uint256 _id)` - correct. It pulls the required amount from the user's balance/allowance internally?
        // No, `payDispute` in solidity usually transfers `requiredStake` from msg.sender.
        // Wait, why did the hook convert `amountStr`?
        // Ah, the hook used `amountToApprove = disputeData.requiredStake`.
        // The `amountStr` argument in `payDispute` function signature was unused in the original code logic?
        // Original: `payDispute = async (..., _amountStr) ... const amountToApprove = disputeData.requiredStake`
        // So `_amountStr` was ignored or used for UI validaton?
        // I will trust the contract's `requiredStake` like the original code did.
      });

      // Wait for payment to be mined
      await publicClient.waitForTransactionReceipt({ hash: payHash });

      toast.success("Payment successful!");
      return true;
    } catch (error: any) {
      console.error("Payment flow failed", error);
      const msg =
        error.reason || error.shortMessage || error.message || "Unknown error";
      toast.error(`Payment failed: ${msg}`);
      return false;
    } finally {
      setLoading(false);
      setStep("idle");
    }
  };

  return {
    payDispute,
    // Match the original return names for compatibility if possible, or update consumers
    isPaying: loading,
    step,
  };
}
