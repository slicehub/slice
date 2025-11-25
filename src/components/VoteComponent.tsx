import React, { useState } from "react";
import { Button, Text, Card, Input } from "@stellar/design-system";
import { Box } from "./layout/Box";
import { useWallet } from "../hooks/useWallet";
import { useSliceVoting } from "../hooks/useSliceVoting";

export const VoteComponent: React.FC = () => {
  const { address } = useWallet();
  const { commitVote, revealVote, isProcessing, logs } = useSliceVoting();

  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [disputeId, setDisputeId] = useState<string>("1");

  const handleVoteSelect = (vote: number) => {
    setSelectedVote(vote);
  };

  const handleCommit = async () => {
    if (selectedVote === null) return;
    await commitVote(disputeId, selectedVote);
  };

  const handleReveal = async () => {
    await revealVote(disputeId);
  };

  return (
    <Card>
      <Box gap="md" direction="column">
        <Text as="h2" size="lg">
          Juror Private Vote (Commit + Reveal with ZK)
        </Text>

        <Input
          id="dispute-id"
          label="Dispute ID"
          value={disputeId}
          onChange={(e) => setDisputeId(e.target.value)}
          fieldSize="md"
        />

        <Box gap="md" direction="row" justify="center">
          <Button
            variant={selectedVote === 0 ? "primary" : "secondary"}
            onClick={() => handleVoteSelect(0)}
            disabled={isProcessing}
            size="md"
          >
            Vote Party A (0)
          </Button>

          <Button
            variant={selectedVote === 1 ? "primary" : "secondary"}
            onClick={() => handleVoteSelect(1)}
            disabled={isProcessing}
            size="md"
          >
            Vote Party B (1)
          </Button>
        </Box>

        <Box gap="sm" direction="row">
          <Button
            variant="primary"
            size="md"
            onClick={() => void handleCommit()}
            disabled={isProcessing || selectedVote === null || !address}
            isLoading={isProcessing}
          >
            Commit Vote
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => void handleReveal()}
            disabled={isProcessing || !address}
            isLoading={isProcessing}
          >
            Reveal Vote
          </Button>
        </Box>

        {logs && (
          <div
            style={{
              marginTop: 10,
              padding: 15,
              background: "#2c3e50",
              color: "#fff",
              borderRadius: 4,
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
              fontSize: 12,
            }}
          >
            {logs}
          </div>
        )}
      </Box>
    </Card>
  );
};
