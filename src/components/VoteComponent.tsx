import React, { useState, useRef, useCallback } from "react";
import { Button, Text, Card, Input, Code } from "@stellar/design-system";
import { Box } from "./layout/Box";
import { useWallet } from "../hooks/useWallet";
import { NoirService } from "../services/NoirService";
import { StellarContractService } from "../services/StellarContractService";
import slice from "../contracts/slice";

// Helper to generate a random 31-byte hex salt (safe for BN254 Field size)
const generateRandomSalt = () => {
  const array = new Uint8Array(31);
  crypto.getRandomValues(array);
  return (
    "0x" +
    Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
};

export const VoteComponent: React.FC = () => {
  const { address, signTransaction } = useWallet();
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [salt, setSalt] = useState<string>(() => generateRandomSalt());
  const [disputeId, setDisputeId] = useState<string>("1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<string>("");

  const noirService = useRef(new NoirService());

  const handleVoteSelect = (vote: number) => {
    setSelectedVote(vote);
    setSalt(generateRandomSalt());
    setOutput("");
  };

  const generateAndSubmitVote = useCallback(async () => {
    if (!address || !signTransaction) {
      setOutput("Error: Please connect your wallet first.");
      return;
    }

    if (selectedVote === null) {
      setOutput("Error: Please select a vote option (Party A or Party B).");
      return;
    }

    setIsGenerating(true);
    setOutput("Generating ZK Proof for Vote...");

    try {
      const inputs = {
        vote: selectedVote,
        salt: salt,
      };

      const proofResult = await noirService.current.generateProof(
        "vote",
        inputs,
      );

      setOutput(
        (prev) =>
          prev +
          `\n\n✓ Proof Generated!
Proof ID: ${proofResult.proofId.slice(0, 16)}...
Commitment Hash generated inside circuit.

Submitting to Slice Contract...`,
      );

      slice.options.publicKey = address;

      const proofBuffer = StellarContractService.toBuffer(
        proofResult.proofBlob,
      );
      const publicInputsBuffer = StellarContractService.toBuffer(
        proofResult.publicInputs,
      );

      const walletSignTransaction = async (xdr: string) => {
        const signed = await signTransaction(xdr);
        return {
          signedTxXdr: signed.signedTxXdr,
          signerAddress: signed.signerAddress ?? address,
        };
      };

      const tx = await slice.submit_vote({
        caller: address,
        dispute_id: BigInt(disputeId),
        proof: proofBuffer,
        public_inputs: publicInputsBuffer,
      });

      const result = await tx.signAndSend({
        signTransaction: walletSignTransaction,
      });
      // Explicitly type 'result' as 'unknown' and handle type assertion before passing to extractTransactionData
      const txData = StellarContractService.extractTransactionData(
        result as Parameters<
          typeof StellarContractService.extractTransactionData
        >[0],
      );

      if (txData.success) {
        setOutput(
          (prev) =>
            prev +
            `\n\n✓ Vote Submitted Successfully!
Tx Hash: ${txData.txHash?.slice(0, 10)}...
Fee: ${txData.fee} stroops

IMPORTANT: Save your SALT to reveal later!
Salt: ${salt}`,
        );
      } else {
        setOutput((prev) => prev + `\n\n❌ Submission Failed.`);
      }
    } catch (error: unknown) {
      console.error(error);
      // [FIX] Safe error handling
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setOutput((prev) => prev + `\n\n❌ Error: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  }, [address, signTransaction, selectedVote, salt, disputeId]);

  return (
    <Card>
      <Box gap="md" direction="column">
        <Text as="h2" size="lg">
          Juror Private Voting (ZK)
        </Text>
        <Text as="p" size="sm" style={{ color: "#6b7280" }}>
          Cast your vote privately. A Zero-Knowledge proof will be generated
          locally to verify your vote is valid (0 or 1) and lock in your
          commitment without revealing your choice to the network.
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
            disabled={isGenerating}
            size="md"
          >
            Vote Party A (0)
          </Button>
          <Button
            variant={selectedVote === 1 ? "primary" : "secondary"}
            onClick={() => handleVoteSelect(1)}
            disabled={isGenerating}
            size="md"
          >
            Vote Party B (1)
          </Button>
        </Box>

        {selectedVote !== null && (
          <Box
            gap="xs"
            direction="column"
            style={{
              background: "#f3f4f6",
              padding: "10px",
              borderRadius: "4px",
            }}
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
          // [FIX] Explicitly voiding the promise return
          onClick={() => void generateAndSubmitVote()}
          disabled={isGenerating || selectedVote === null || !address}
          isLoading={isGenerating}
        >
          {isGenerating
            ? "Generating Proof & Submitting..."
            : "Encrypt & Submit Vote"}
        </Button>

        {output && (
          <div
            style={{
              marginTop: "10px",
              padding: "15px",
              background: "#2c3e50",
              color: "#fff",
              borderRadius: "4px",
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
              fontSize: "12px",
            }}
          >
            {output}
          </div>
        )}
      </Box>
    </Card>
  );
};
