import React, { useState } from "react";
import { Button, Text, Card, Input, Code } from "@stellar/design-system";
import { Box } from "./layout/Box";
import { useWallet } from "../hooks/useWallet";
import { useSliceVoting } from "../hooks/useSliceVoting";

export const VoteComponent: React.FC = () => {
  const { address } = useWallet();
  const { submitVote, generateSalt, isProcessing, logs, setLogs } =
    useSliceVoting();

  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [salt, setSalt] = useState<string>(() => generateSalt());
  const [disputeId, setDisputeId] = useState<string>("1");

  const handleVoteSelect = (vote: number) => {
    setSelectedVote(vote);
    setSalt(generateSalt());
    setLogs(""); // Clear previous logs
  };

  const handleSubmit = async () => {
    if (selectedVote === null) return;

    // The hook handles the entire flow: Commit -> Generate Proof -> Reveal
    await submitVote(disputeId, selectedVote, salt);
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

        {selectedVote !== null && (
          <Box
            gap="xs"
            direction="column"
            style={{ background: "#f3f4f6", padding: 10, borderRadius: 4 }}
          >
            <Text as="span" size="xs" weight="bold">
              Generated Secret Salt:
            </Text>
            <Code size="sm" style={{ wordBreak: "break-all" }}>
              {salt}
            </Code>
          </Box>
        )}

        <Button
          variant="primary"
          size="lg"
          onClick={() => void handleSubmit()}
          disabled={isProcessing || selectedVote === null || !address}
          isLoading={isProcessing}
        >
          {isProcessing ? "Processing Vote..." : "Generate Proof & Vote"}
        </Button>

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
