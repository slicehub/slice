import { useState } from "react";
import { Contract } from "ethers";
import { useChainId } from "wagmi";
import { toast } from "sonner";
import { useSliceContract } from "./useSliceContract";
import { useXOContracts } from "@/providers/XOContractsProvider";
import { getContractsForChain } from "@/config/contracts";
import { erc20Abi } from "@/contracts/erc20-abi";

export function usePayDispute() {
  const { address, signer } = useXOContracts();
  const [isPaying, setIsPaying] = useState(false);

  // 1. Get current chain to pick the right contract address
  const chainId = useChainId();

  // 2. We use the contract hook, which is now chain-aware (per your previous refactor)
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
      // so we don't accidentally send a tx to the wrong deployment.
      const { sliceContract } = getContractsForChain(chainId);

      // --- STEP 2: Fetch Data Dynamically (The "Safe" Hybrid Approach) ---
      // Instead of assuming the token from config, we ask the contract directly.
      // This guarantees we approve the exact token this specific deployment requires.
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

      const msg = err.reason || err.message || "Unknown error";

      if (msg.includes("exceeds allowance")) {
        toast.error("Error: Token allowance insufficient.");
      } else if (msg.includes("Wrong phase")) {
        toast.error("Error: Dispute is not in the payment phase.");
      } else {
        toast.error(`Payment failed: ${msg.slice(0, 60)}...`);
      }
      return false;
    } finally {
      setIsPaying(false);
    }
  };

  return { payDispute, isPaying };
}
