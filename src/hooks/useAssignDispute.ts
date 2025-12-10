import { useCallback, useState } from "react";
import { useSliceContract } from "./useSliceContract";
import { useXOContracts } from "@/providers/XOContractsProvider";
import { parseEther } from "ethers";
import { toast } from "sonner";

// Note: saves the dispute we join to local storage
export function useAssignDispute() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFinding, setIsFinding] = useState(false);
  const contract = useSliceContract();
  const { address } = useXOContracts();

  // 1. MATCHMAKER: Find a random active dispute ID
  const findActiveDispute = useCallback(async (): Promise<number | null> => {
    if (!contract) return null;
    setIsFinding(true);

    try {
      const countBigInt = await contract.disputeCount();
      const totalDisputes = Number(countBigInt);

      if (totalDisputes === 0) {
        toast.error("No disputes created yet.");
        return null;
      }

      console.log(`Searching ${totalDisputes} disputes for active cases...`);

      const availableIds: number[] = [];

      // Scan for Active disputes (Status 0=Created or 1=Commit)
      // We skip Status 2 (Reveal) and 3 (Executed)
      for (let i = 1; i <= totalDisputes; i++) {
        try {
          const d = await contract.disputes(i);
          const status = Number(d.status);

          // 1. Check On-Chain Status (Must be Commit Phase)
          // If you want to avoid unpaid disputes, strictly require Status 1.
          // If Status 0 is allowed, keep "status < 2".
          const isActiveStatus = status === 1;

          // 2. Check Timestamps
          // Contract returns seconds, JS needs milliseconds
          const commitDeadline = Number(d.commitDeadline) * 1000;
          const now = Date.now();
          const isWithinTime = now < commitDeadline;

          // 3. Optional: Check Funding Explicitly
          // (If status is 1, they should be paid, but safe to check)
          const isFunded = d.claimerPaid && d.defenderPaid;

          // Only add if it's active
          if (isActiveStatus && isWithinTime && isFunded) {
            availableIds.push(i);
          }
        } catch (e) {
          console.warn(`Skipping dispute #${i}`, e);
        }
      }
      // Random Selection
      const randomIndex = Math.floor(Math.random() * availableIds.length);
      return availableIds[randomIndex];
    } catch (error) {
      console.error("Error finding dispute:", error);
      toast.error("Error searching for disputes");
      return null;
    } finally {
      setIsFinding(false);
    }
  }, [contract]);

  // 2. ACTION: Join a specific dispute
  const joinDispute = async (disputeId: number, stakeAmountEth: string) => {
    if (!contract || !address) {
      toast.error("Wallet not connected");
      return false;
    }

    setIsLoading(true);

    try {
      console.log(`Joining Dispute #${disputeId} with ${stakeAmountEth} ETH`);

      const tx = await contract.joinDispute(disputeId, {
        value: parseEther(stakeAmountEth),
      });

      toast.info("Transaction sent...");
      await tx.wait();

      // Save Joined Status Locally
      // We use a Set-like structure in localStorage to track joined IDs
      const storageKey = `slice_joined_disputes_${address}`;
      const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (!existing.includes(disputeId)) {
        existing.push(disputeId);
        localStorage.setItem(storageKey, JSON.stringify(existing));
      }

      toast.success(`Successfully joined Dispute #${disputeId}!`);
      return true;
    } catch (error: any) {
      console.error("Error joining dispute:", error);
      const msg = error.reason || error.message || "Transaction failed";

      if (msg.includes("revert")) {
        toast.error(
          "Transaction reverted. You may have already joined this dispute.",
        );
      } else {
        toast.error("Failed to join dispute.");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { findActiveDispute, joinDispute, isLoading, isFinding };
}
