import { useState } from "react";
import { Contract } from "ethers";
import { toast } from "sonner";
import { useSliceContract } from "./useSliceContract";
import { useSmartWallet } from "@/hooks/useSmartWallet";
import { getContractsForChain } from "@/config/contracts";
import { erc20Abi } from "@/contracts/erc20-abi";

export function usePayDispute() {
  const { address, signer, chainId } = useSmartWallet();
  const [isPaying, setIsPaying] = useState(false);

  // 1. We use the contract hook, which is now chain-aware
  const contract = useSliceContract();

  const payDispute = async (disputeId: string | number, _amountStr: string) => {
    if (!contract || !address || !signer) {
      toast.error("Please connect your wallet");
      return false;
    }

    setIsPaying(true);

    try {
      // --- STEP 1: Verify Chain Consistency ---
      // We double-check that the config map matches the current chain
      const { sliceContract } = getContractsForChain(chainId);

      // --- STEP 2: Fetch Data Dynamically (The "Safe" Hybrid Approach) ---
      // Instead of assuming the token from config, we ask the contract directly.
      const stakingTokenAddress = await contract.stakingToken();

      // Fetch the exact required stake amount from on-chain data
      const disputeData = await contract.disputes(disputeId);
      const amountToApprove = disputeData.requiredStake;

      // --- STEP 3: Check Allowance ---
      const tokenContract = new Contract(stakingTokenAddress, erc20Abi, signer);
      const currentAllowance = await tokenContract.allowance(
        address,
        sliceContract,
      );

      if (currentAllowance < amountToApprove) {
        toast.info("Approving Token...");
        const approveTx = await tokenContract.approve(
          sliceContract,
          amountToApprove,
        );
        await approveTx.wait();
        toast.success("Approval confirmed.");

        // Brief pause to ensure RPC nodes index the approval transaction
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // --- STEP 4: Execute Payment ---
      toast.info("Paying Dispute...");

      // Estimate gas explicitly to detect potential reverts (like wrong phase) early
      // Note: Using BigInt() for compatibility with ES2020+
      const estimatedGas = await contract.payDispute.estimateGas(disputeId);
      const gasLimit = (estimatedGas * BigInt(120)) / BigInt(100); // 20% buffer

      const tx = await contract.payDispute(disputeId, { gasLimit });
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.success("Payment successful!");
        return true;
      } else {
        throw new Error("Transaction reverted");
      }
    } catch (err: any) {
      console.error("Pay Dispute Error:", err);

      const msg =
        err.reason || err.shortMessage || err.message || "Unknown error";

      // Keep your specific checks but append the raw error for debugging
      if (msg.includes("exceeds allowance")) {
        toast.error(`Error: Token allowance insufficient. (${msg})`);
      } else if (msg.includes("Wrong phase")) {
        toast.error(`Error: Dispute is not in the payment phase. (${msg})`);
      } else {
        toast.error(`Payment failed: ${msg}`);
      }
      return false;
    } finally {
      setIsPaying(false);
    }
  };

  return { payDispute, isPaying };
}
