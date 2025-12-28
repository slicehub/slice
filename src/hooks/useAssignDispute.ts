import { useCallback, useState } from "react";
import {
  useWriteContract,
  usePublicClient,
  useAccount,
  useChainId,
} from "wagmi";
import { erc20Abi } from "viem";
import { SLICE_ABI, getContractsForChain } from "@/config/contracts";
import { toast } from "sonner";

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
    await new Promise((r) => setTimeout(r, 100));
  }
  return results;
}

export function useAssignDispute() {
  const [isFinding, setIsFinding] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { address } = useAccount();
  const chainId = useChainId();

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  // We need contracts
  const { sliceContract, usdcToken } = getContractsForChain(chainId);

  // 1. MATCHMAKER Logic
  // We need to fetch disputeCount and check disputes.
  // Using publicClient for these one-off reads is cleaner than hooks inside a callback.

  const findActiveDispute = useCallback(async (): Promise<number | null> => {
    if (!publicClient || !sliceContract) return null;
    setIsFinding(true);

    try {
      // Step 1: Get Total Count
      const count = await publicClient.readContract({
        address: sliceContract as `0x${string}`,
        abi: SLICE_ABI,
        functionName: "disputeCount",
      });

      const totalDisputes = Number(count);
      if (totalDisputes === 0) {
        toast.error("No disputes created yet.");
        return null;
      }

      // Step 2: Batched Search
      // IDs are 0 to total-1.
      const correctIds = Array.from({ length: totalDisputes }, (_, i) => i);

      const results = await processInBatches(correctIds, 5, async (id) => {
        try {
          const d = await publicClient.readContract({
            address: sliceContract as `0x${string}`,
            abi: SLICE_ABI,
            functionName: "disputes",
            args: [BigInt(id)],
          });
          // d is struct. status is enum (uint8).
          if (d.status === 1) return id; // Status 1 = Commit Phase (Open)
        } catch (e) {
          console.warn(`[Matchmaker] Skipped #${id}`, e);
        }
        return null;
      });

      const availableIds = results.filter((id): id is number => id !== null);

      if (availableIds.length === 0) {
        // Fallback if none found?
        return null;
      }

      const randomIndex = Math.floor(Math.random() * availableIds.length);
      return availableIds[randomIndex];
    } catch (error) {
      console.error("[Matchmaker] Error:", error);
      return null;
    } finally {
      setIsFinding(false);
    }
  }, [publicClient, sliceContract]);

  // 2. ACTION: Join Dispute
  const joinDispute = async (disputeId: number) => {
    if (!address || !publicClient) {
      toast.error("Wallet not connected");
      return false;
    }

    try {
      setIsJoining(true);

      // Fetch required stake
      const disputeData = await publicClient.readContract({
        address: sliceContract as `0x${string}`,
        abi: SLICE_ABI,
        functionName: "disputes",
        args: [BigInt(disputeId)],
      });
      const amountToApprove = disputeData.jurorStake;

      console.log(`[Join] Required Stake: ${amountToApprove}`);

      // Check Allowance
      const allowance = await publicClient.readContract({
        address: usdcToken as `0x${string}`,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, sliceContract as `0x${string}`],
      });

      if (allowance < amountToApprove) {
        toast.info("Approving Stake...");
        const approveHash = await writeContractAsync({
          address: usdcToken as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [sliceContract as `0x${string}`, amountToApprove],
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        toast.success("Approval confirmed.");
      }

      toast.info("Joining Jury...");

      const joinHash = await writeContractAsync({
        address: sliceContract as `0x${string}`,
        abi: SLICE_ABI,
        functionName: "joinDispute", // Assuming naming is joinDispute or stake? Original used: `contract.joinDispute`.
        // ABI in `slice-abi.ts` has `joinDispute`. Use that.
        args: [BigInt(disputeId)],
      });

      await publicClient.waitForTransactionReceipt({ hash: joinHash });

      toast.success("Successfully joined the dispute!");
      return true;
    } catch (error: any) {
      console.error("Join failed", error);
      toast.error(`Join failed: ${error.shortMessage || error.message}`);
      return false;
    } finally {
      setIsJoining(false);
    }
  };

  return {
    findActiveDispute,
    joinDispute,
    isLoading: isJoining, // Mapped to match old hook
    isFinding,
    isReady: !!address,
  };
}
