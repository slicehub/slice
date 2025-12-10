import { useState } from "react";
import { useSliceContract } from "./useSliceContract";
import { toast } from "sonner";
import { uploadJSONToIPFS } from "@/util/ipfs";

export function useCreateDispute() {
  const [isCreating, setIsCreating] = useState(false);
  const contract = useSliceContract();

  const createDispute = async (
    defenderAddress: string,
    category: string,
    disputeData: {
      title: string;
      description: string;
      evidence?: string[];
    },
    jurorsRequired: number = 3,
  ): Promise<boolean> => {
    if (!contract) {
      toast.error("Wallet not connected");
      return false;
    }

    setIsCreating(true);
    try {
      toast.info("Uploading evidence to IPFS...");

      const ipfsHash = await uploadJSONToIPFS({
        ...disputeData,
        category,
      });
      if (!ipfsHash) {
        throw new Error("Failed to upload to IPFS");
      }

      console.log("IPFS Hash created:", ipfsHash);
      toast.info("Creating dispute on-chain...");

      // 1. Call the contract function
      const time = 60 * 60 * 24;
      const tx = await contract.createDispute({
        defender: defenderAddress,
        category: category,
        ipfsHash: ipfsHash,
        jurorsRequired: BigInt(jurorsRequired),
        paySeconds: BigInt(time),
        commitSeconds: BigInt(time),
        revealSeconds: BigInt(time),
      });

      console.log("Transaction sent:", tx.hash);
      toast.info("Transaction sent. Waiting for confirmation...");

      // 2. Wait for the transaction to be mined
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      toast.success("Dispute created successfully!");
      return true; // SUCCESS
    } catch (error) {
      console.error("Error creating dispute:", error);
      toast.error("Failed to create dispute");
      return false; // FAILURE
    } finally {
      setIsCreating(false);
    }
  };

  return { createDispute, isCreating };
}
