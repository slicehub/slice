import { useState } from "react";
import { toast } from "sonner";
import { useSliceContract } from "./useSliceContract";
import { calculateCommitment, generateSalt } from "../util/votingUtils";
import { useXOContracts } from "@/providers/XOContractsProvider";

export const useSliceVoting = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string>("");

  const contract = useSliceContract();
  const { address } = useXOContracts();

  // Helper to generate a unique storage key for this specific dispute + user
  const getStorageKey = (disputeId: string) =>
    `slice_vote_${disputeId}_${address}`;

  /**
   * STEP 1: COMMIT VOTE
   * Generates a secret salt, hashes it with the vote, stores it locally,
   * and sends the hash to the blockchain.
   */
  const commitVote = async (disputeId: string, vote: number) => {
    if (!contract || !address) {
      toast.error("Wallet not connected");
      return false;
    }

    setIsProcessing(true);
    setLogs("Generating secure commitment...");

    try {
      // 1. Generate a random cryptographic salt (private password for this vote)
      const salt = generateSalt();

      // 2. Create the commitment hash: keccak256(vote + salt)
      // This is what we send to the chain. It hides the vote.
      const commitmentHash = calculateCommitment(vote, salt);

      console.log(`Vote: ${vote}, Salt: ${salt}, Hash: ${commitmentHash}`);

      // 3. IMPORTANT: Save the salt and vote locally!
      // If the user loses this salt, they cannot reveal and will lose their stake.
      const storageData = {
        vote,
        salt: salt.toString(), // Convert BigInt to string for JSON storage
        timestamp: Date.now(),
      };

      localStorage.setItem(
        getStorageKey(disputeId),
        JSON.stringify(storageData),
      );

      setLogs("Sending commitment to blockchain...");

      // 4. Send transaction to smart contract
      const tx = await contract.commitVote(disputeId, commitmentHash);

      setLogs("Waiting for confirmation...");
      await tx.wait();

      toast.success(
        "Vote committed successfully! Salt saved to browser storage.",
      );
      setLogs("Commitment confirmed on-chain.");
      return true;
    } catch (error: any) {
      console.error("Commit Error:", error);
      // Handle "User denied transaction" or contract reverts
      const msg = error.reason || error.message || "Failed to commit vote";
      toast.error(msg);
      setLogs(`Error: ${msg}`);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * STEP 2: REVEAL VOTE
   * Retrieves the secret salt from local storage and sends it to the
   * blockchain to prove the original vote.
   */
  const revealVote = async (disputeId: string) => {
    if (!contract || !address) {
      toast.error("Wallet not connected");
      return false;
    }

    setIsProcessing(true);
    setLogs("Retrieving secret salt...");

    try {
      // 1. Retrieve the salt from local storage
      const storedDataString = localStorage.getItem(getStorageKey(disputeId));

      if (!storedDataString) {
        throw new Error(
          "No local vote data found for this dispute. Did you clear your cache?",
        );
      }

      const { vote, salt } = JSON.parse(storedDataString);

      setLogs(`Revealing Vote: ${vote}...`);

      // 2. Send the original vote and salt to the contract
      // The contract will re-hash them. If matches commitment, vote counts.
      const tx = await contract.revealVote(disputeId, vote, BigInt(salt));

      setLogs("Waiting for confirmation...");
      await tx.wait();

      toast.success(
        "Vote revealed successfully! You are now eligible for rewards.",
      );
      setLogs("Vote revealed and counted.");
      return true;
    } catch (error: any) {
      console.error("Reveal Error:", error);
      const msg = error.reason || error.message || "Failed to reveal vote";

      if (msg.includes("Hash mismatch")) {
        toast.error(
          "Integrity Error: The saved salt does not match your on-chain commitment.",
        );
      } else if (msg.includes("No local vote data")) {
        toast.error(msg);
      } else {
        toast.error("Failed to reveal vote");
      }

      setLogs(`Error: ${msg}`);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return { commitVote, revealVote, isProcessing, logs };
};
