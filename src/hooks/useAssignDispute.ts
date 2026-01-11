import { useCallback, useState } from "react";
import {
  useWriteContract,
  usePublicClient,
  useAccount,
  useChainId,
} from "wagmi";
import { erc20Abi, parseUnits } from "viem"; // Added parseUnits
import { SLICE_ABI, getContractsForChain } from "@/config/contracts";
import { toast } from "sonner";
import { useStakingToken } from "./useStakingToken";

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

  const { address: stakingToken, decimals, symbol } = useStakingToken();
  const { address } = useAccount();
  const chainId = useChainId();

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  // We need contracts
  const { sliceContract } = getContractsForChain(chainId);

  // 1. MATCHMAKER Logic
  const findActiveDispute = useCallback(async (): Promise<number | null> => {
    if (!publicClient || !sliceContract) return null;
    setIsFinding(true);

    try {
      // Step 1: Get Total Count
      const count = await publicClient.readContract({
        address: sliceContract,
        abi: SLICE_ABI,
        functionName: "disputeCount",
      });

      const totalDisputes = Number(count);
      if (totalDisputes === 0) {
        toast.error("No disputes created yet.");
        return null;
      }

      // Step 2: Batched Search
      // IDs are 1 to total.
      const correctIds = Array.from({ length: totalDisputes }, (_, i) => i + 1);

      const results = await processInBatches(correctIds, 5, async (id) => {
        try {
          const d = await publicClient.readContract({
            address: sliceContract,
            abi: SLICE_ABI,
            functionName: "disputes",
            args: [BigInt(id)],
          });
          // d is struct. status is enum (uint8).
          // Handle both object (struct) and array return types safely
          const raw = d as any;
          const status = raw.status ?? raw[9] ?? null; // Index 9 = status in Dispute struct
          if (status === 1) return id; // Status 1 = Commit Phase (Open)
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
  const joinDispute = async (disputeId: number, amount: string = "50") => {
    if (!address || !publicClient) {
      toast.error("Wallet not connected");
      return false;
    }

    try {
      setIsJoining(true);

      const amountToStake = parseUnits(amount, decimals);

      console.log(`[Join] Staking: ${amount} ${symbol} (${amountToStake})`);

      // Check Allowance
      const allowance = await publicClient.readContract({
        address: stakingToken,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, sliceContract],
      });

      if (allowance < amountToStake) {
        toast.info("Approving Stake...");
        const approveHash = await writeContractAsync({
          address: stakingToken,
          abi: erc20Abi,
          functionName: "approve",
          args: [sliceContract, amountToStake],
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        toast.success("Approval confirmed.");
      }

      toast.info("Joining Jury...");

      const joinHash = await writeContractAsync({
        address: sliceContract,
        abi: SLICE_ABI,
        functionName: "joinDispute",
        args: [BigInt(disputeId), amountToStake], // Pass explicit amount
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
    isLoading: isJoining,
    isFinding,
    isReady: !!address,
  };
}
