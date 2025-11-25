import { useState } from "react";
import { useSliceVoting } from "../hooks/useSliceVoting";

export const JurorVotingBooth = ({ disputeId }: { disputeId: string }) => {
  const { commitVote, revealVote, isProcessing, logs } = useSliceVoting();

  // 0 = Party A, 1 = Party B
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleCommit = async () => {
    if (selectedOption === null) return;
    await commitVote(disputeId, selectedOption);
  };

  const handleReveal = async () => {
    await revealVote(disputeId);
  };

  return (
    <div>
      <h3>Cast Private Vote</h3>
      <button onClick={() => setSelectedOption(0)}>Vote Party A</button>
      <button onClick={() => setSelectedOption(1)}>Vote Party B</button>

      <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
        <button
          onClick={() => void handleCommit()}
          disabled={isProcessing || selectedOption === null}
        >
          {isProcessing ? "Processing..." : "1. Commit Vote"}
        </button>

        <button onClick={() => void handleReveal()} disabled={isProcessing}>
          {isProcessing ? "Processing..." : "2. Reveal Vote"}
        </button>
      </div>

      {/* Optional: Display progress logs */}
      <pre style={{ fontSize: "10px", marginTop: "10px" }}>{logs}</pre>
    </div>
  );
};
