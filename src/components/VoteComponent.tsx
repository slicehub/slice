import React, { useState, useRef, useCallback } from "react";
import { Button, Text, Card, Input, Code } from "@stellar/design-system";
import { Box } from "./layout/Box";
import { useWallet } from "../hooks/useWallet";
import { NoirService } from "../services/NoirService";
import { StellarContractService } from "../services/StellarContractService";
import slice from "../contracts/slice";
import { Buffer } from "buffer";

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
    setOutput("Generating ZK Proof for Vote Reveal...");

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

Submitting Reveal to Slice Contract...`,
      );

      slice.options.publicKey = address;

      // 1. Prepare Salt (BytesN<32>)
      // Remove 0x prefix and parse hex
      const saltHex = salt.replace(/^0x/, "");
      const rawSaltBuffer = Buffer.from(saltHex, "hex");
      // Pad to 32 bytes (random salt is 31 bytes to fit in BN254 field)
      const saltBuffer = Buffer.alloc(32);
      rawSaltBuffer.copy(saltBuffer, 32 - rawSaltBuffer.length);

      // 2. Prepare Proof and VK (Bytes)
      const vkJsonBuffer = StellarContractService.toBuffer(proofResult.vkJson);
      const proofBlobBuffer = StellarContractService.toBuffer(
        proofResult.proofBlob,
      );

      // 3. Define Signer Helper
      const walletSignTransaction = async (xdr: string) => {
        const signed = await signTransaction(xdr);
        return {
          signedTxXdr: signed.signedTxXdr,
          signerAddress: signed.signerAddress ?? address,
        };
      };

      // 4. Build Transaction
      // Note: This assumes the user has already Committed and is now Revealing
      const tx = await slice.reveal_vote({
        caller: address,
        dispute_id: BigInt(disputeId),
        vote: selectedVote,
        salt: saltBuffer,
        vk_json: vkJsonBuffer,
        proof_blob: proofBlobBuffer,
      });

      // 5. Sign and Send (Fixing ESLint unsafe-assignment error)
      // We cast to unknown first to handle the generic Result type from the SDK
      const result = (await tx.signAndSend({
        signTransaction: walletSignTransaction,
      })) as unknown;

      const txData = StellarContractService.extractTransactionData(
        result as Parameters<
          typeof StellarContractService.extractTransactionData
        >[0],
      );

      if (txData.success) {
        setOutput(
          (prev) =>
            prev +
            `\n\n✓ Vote Revealed Successfully!
Tx Hash: ${txData.txHash?.slice(0, 10)}...
Fee: ${txData.fee} stroops

IMPORTANT: You have successfully revealed your vote.`,
        );
      } else {
        setOutput((prev) => prev + `\n\n❌ Submission Failed.`);
      }
    } catch (error: unknown) {
      console.error(error);
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
          Juror Private Vote Reveal (ZK)
        </Text>
        <Text as="p" size="sm" style={{ color: "#6b7280" }}>
          Reveal your vote to the chain. A Zero-Knowledge proof will be
          generated locally to verify your vote matches your earlier commitment
          (vote + salt) without publicly exposing your salt until the proof is
          verified.
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
          onClick={() => void generateAndSubmitVote()}
          disabled={isGenerating || selectedVote === null || !address}
          isLoading={isGenerating}
        >
          {isGenerating
            ? "Generating Proof & Submitting..."
            : "Generate Proof & Reveal Vote"}
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
