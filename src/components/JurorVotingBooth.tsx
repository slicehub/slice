import { useState } from "react";
import { useSliceVoting } from "../hooks/useSliceVoting";

export const JurorVotingBooth = ({ disputeId }: { disputeId: string }) => {
  const { submitVote, generateSalt, isProcessing, logs } = useSliceVoting();

  // 0 = Party A, 1 = Party B
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleVote = async () => {
    if (selectedOption === null) return;

    // 1. Generate a cryptographic salt locally
    const salt = generateSalt();

    // 2. Trigger the full voting flow
    // This performs Commit -> Proof Generation -> Reveal sequentially
    await submitVote(disputeId, selectedOption, salt);
  };

  return (
    <div>
      <h3>Cast Private Vote</h3>
      <button onClick={() => setSelectedOption(0)}>Vote Party A</button>
      <button onClick={() => setSelectedOption(1)}>Vote Party B</button>

      <button
        onClick={() => void handleVote()}
        disabled={isProcessing || selectedOption === null}
      >
        {isProcessing ? "Generating ZK Proof..." : "Submit Verdict"}
      </button>

      {/* Optional: Display progress logs (Commit tx, Proof Gen, Reveal tx) */}
      <pre>{logs}</pre>
    </div>
  );
};
