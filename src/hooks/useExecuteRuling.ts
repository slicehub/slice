import { useState } from "react";
import { useSliceContract } from "./useSliceContract";
import { useXOContracts } from "@/providers/XOContractsProvider";
import { toast } from "sonner";

export function useExecuteRuling() {
  const { address } = useXOContracts();
  const [isExecuting, setIsExecuting] = useState(false);
  const contract = useSliceContract();

  const executeRuling = async (disputeId: string | number) => {
    if (!contract || !address) {
      toast.error("Please connect your wallet");
      return null;
    }

    setIsExecuting(true);

    try {
      console.log(`Executing ruling for dispute #${disputeId}...`);

      // 1. Send Transaction
      const tx = await contract.executeRuling(disputeId);

      toast.info("Transaction sent. Waiting for confirmation...");

      // 2. Wait for confirmation
      const receipt = await tx.wait();
      console.log("Ruling executed:", receipt);

      // 3. Optional: Parse events to find the winner if needed immediately
      // For now, we assume success based on receipt status
      if (receipt.status === 1) {
        toast.success("Ruling executed successfully!");
        return true;
      } else {
        throw new Error("Transaction failed on-chain");
      }
    } catch (err: any) {
      console.error("Execution Error:", err);

      // Handle common contract reverts
      const msg = err.reason || err.message || "Unknown error";
      if (msg.includes("Wrong phase")) {
        toast.error("Cannot execute yet. Dispute is not in Reveal phase.");
      } else {
        toast.error(`Execution failed: ${msg}`);
      }
      return null;
    } finally {
      setIsExecuting(false);
    }
  };

  return { executeRuling, isExecuting };
}
