import { useCallback, useState } from "react";
import { Contract } from "ethers";
import { useSliceContract } from "./useSliceContract";
import { useSmartWallet } from "@/hooks/useSmartWallet";
import { toast } from "sonner";
import { getContractsForChain } from "@/config/contracts";
import { useContractTx } from "./useContractTx";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

// Helper to process arrays in chunks (to avoid RPC blocking)
async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    await new Promise((r) => setTimeout(r, 100)); // Breathing room for RPC
  }
  return results;
}

export function useAssignDispute() {
  const [isFinding, setIsFinding] = useState(false);
  const { address, signer, chainId } = useSmartWallet();
  const contract = useSliceContract();
  const { execute, isProcessing: isLoading } = useContractTx();

  const isReady = !!(contract && address && signer);

  // 1. MATCHMAKER
  const findActiveDispute = useCallback(async (): Promise<number | null> => {
    if (!contract) return null;
    setIsFinding(true);

    try {
      // Step 1: Get Total Count with Retry
      let countBigInt = BigInt(0);
      try {
        countBigInt = await contract.disputeCount();
      } catch (e) {
        console.warn("[Matchmaker] Retrying count fetch...", e);
        await new Promise((r) => setTimeout(r, 1000));
        countBigInt = await contract.disputeCount();
      }

      const totalDisputes = Number(countBigInt);
      if (totalDisputes === 0) {
        toast.error("No disputes created yet.");
        return null;
      }

      // Step 2: Batched Search
      const allIds = Array.from({ length: totalDisputes }, (_, i) => i + 1);
      const results = await processInBatches(allIds, 5, async (id) => {
        try {
          const d = await contract.disputes(id);
          if (Number(d.status) === 1) return id; // Status 1 = Commit Phase
        } catch (e) {
          console.warn(`[Matchmaker] Skipped #${id}`, e);
        }
        return null;
      });

      const availableIds = results.filter((id): id is number => id !== null);

      if (availableIds.length === 0) return null;

      const randomIndex = Math.floor(Math.random() * availableIds.length);
      return availableIds[randomIndex];
    } catch (error) {
      console.error("[Matchmaker] Error:", error);
      return null;
    } finally {
      setIsFinding(false);
    }
  }, [contract]);

  // 2. ACTION: Join Dispute
  const joinDispute = async (disputeId: number) => {
    if (!isReady) {
      toast.error("Wallet not connected");
      return false;
    }

    return execute("Join Dispute", async () => {
      const disputeData = await contract!.disputes(disputeId);
      const amountToApprove = disputeData.jurorStake; // Note: Ensure this field exists on contract struct

      // Get BOTH contracts dynamically from the chain ID
      const { usdcToken, sliceContract: sliceAddress } =
        getContractsForChain(chainId);

      const usdcContract = new Contract(usdcToken, ERC20_ABI, signer);

      console.log(
        `[Join] Approving ${amountToApprove} USDC to Slice: ${sliceAddress}`,
      );

      toast.info("Approving Stake...");
      const approveTx = await usdcContract.approve(
        sliceAddress,
        amountToApprove,
      );
      await approveTx.wait();

      // Polling for Allowance (Robustness)
      toast.info("Verifying approval...");
      let approvalVerified = false;
      for (let i = 0; i < 10; i++) {
        try {
          const allowance = await usdcContract.allowance(address, sliceAddress);
          if (allowance >= amountToApprove) {
            approvalVerified = true;
            break;
          }
        } catch (e) {
          console.warn("Polling for allowance failed, will retry...", e);
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      if (!approvalVerified) {
        throw new Error("Could not verify approval in time.");
      }

      toast.info("Joining Jury...");
      // Manual gas limit to prevent simulation failure
      // RETURN the transaction to be waited on by execute()
      return contract!.joinDispute(disputeId, { gasLimit: 300000 });
    });
  };

  return { findActiveDispute, joinDispute, isLoading, isFinding, isReady };
}

