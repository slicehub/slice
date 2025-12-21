import { useState } from "react";
import { toast } from "sonner";
import { useSliceContract } from "./useSliceContract";
import { calculateCommitment, generateSalt } from "../util/votingUtils";
import { useContracts } from "@/providers/ConnectProvider";
// 1. Import the utility
import { saveVoteData, getVoteData } from "../util/votingStorage";

export const useSliceVoting = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string>("");

  const contract = useSliceContract();
  const { address } = useContracts();

  // --- COMMIT VOTE ---
  const commitVote = async (disputeId: string, vote: number) => {
    // 2. Validate Contract Address
    if (!contract || !contract.target || !address) {
      toast.error("Wallet or Contract not ready");
      return false;
    }
    // Ethers v6 uses .target to get the address
    const contractAddress = contract.target as string;

    setIsProcessing(true);
    setLogs("Generating secure commitment...");

    try {
      const salt = generateSalt();
      const commitmentHash = calculateCommitment(vote, salt);

      console.log(`Vote: ${vote}, Salt: ${salt}, Hash: ${commitmentHash}`);
      setLogs("Sending commitment to blockchain...");

      const tx = await contract.commitVote(disputeId, commitmentHash);
      setLogs("Waiting for confirmation...");
      await tx.wait();

      // 3. Use Utility to Save
      saveVoteData(contractAddress, disputeId, address, vote, salt);

      toast.success("Vote committed successfully! Salt saved.");
      setLogs("Commitment confirmed on-chain.");
      return true;
    } catch (error: any) {
      console.error("Commit Error:", error);
      const msg =
        (error as any).reason ||
        (error as any).shortMessage ||
        (error as any).message ||
        "Failed to commit vote";
      toast.error(`Commit Error: ${msg}`);
      setLogs(`Error: ${msg}`);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // --- REVEAL VOTE ---
  const revealVote = async (disputeId: string) => {
    if (!contract || !contract.target || !address) {
      toast.error("Wallet not connected");
      return false;
    }
    const contractAddress = contract.target as string;

    setIsProcessing(true);
    setLogs("Retrieving secret salt...");

    try {
      // 4. Use Utility to Retrieve
      const storedData = getVoteData(contractAddress, disputeId, address);

      if (!storedData) {
        throw new Error(
          "No local vote data found for this dispute deployment.",
        );
      }

      const { vote, salt } = storedData;

      setLogs(`Revealing Vote: ${vote}...`);

      const tx = await contract.revealVote(disputeId, vote, BigInt(salt));
      setLogs("Waiting for confirmation...");
      await tx.wait();

      toast.success("Vote revealed successfully!");
      setLogs("Vote revealed and counted.");
      return true;
    } catch (error: any) {
      console.error("Reveal Error:", error);
      const msg =
        (error as any).reason ||
        (error as any).shortMessage ||
        (error as any).message ||
        "Failed to reveal vote";
      toast.error(`Reveal Error: ${msg}`);
      setLogs(`Error: ${msg}`);

      setLogs(`Error: ${msg}`);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return { commitVote, revealVote, isProcessing, logs };
};
