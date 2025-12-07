import { useState } from "react";
import { useSliceContract } from "./useSliceContract";
import { useXOContracts } from "@/providers/XOContractsProvider";
import { parseEther } from "ethers";
import { toast } from "sonner";

export function usePayDispute() {
  const { address } = useXOContracts();
  const [isPaying, setIsPaying] = useState(false);
  const contract = useSliceContract();

  const payDispute = async (disputeId: string | number, amountStr: string) => {
    if (!contract || !address) {
      toast.error("Please connect your wallet");
      return false;
    }

    setIsPaying(true);

    try {
      // 1. Convert amount string (e.g. "0.0001") to Wei (BigInt)
      // Ensure we match the contract's requiredStake
      const valueToSend = parseEther(amountStr);

      console.log(`Paying dispute #${disputeId} with ${amountStr} ETH...`);

      // 2. Send Payable Transaction
      const tx = await contract.payDispute(disputeId, {
        value: valueToSend,
      });

      toast.info("Payment sent. Waiting for confirmation...");

      // 3. Wait for confirmation
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.success("Payment successful! Funds locked.");
        return true;
      } else {
        throw new Error("Transaction reverted");
      }
    } catch (err: any) {
      console.error("Pay Dispute Error:", err);

      const msg = err.reason || err.message || "Unknown error";

      if (msg.includes("Incorrect ETH")) {
        toast.error("Incorrect amount sent. Please check the required stake.");
      } else if (msg.includes("Deadline passed")) {
        toast.error("Payment deadline has passed.");
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
