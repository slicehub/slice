import React, { useState, useRef, useCallback } from 'react';
import { Button, Text, Card, Input, Code } from '@stellar/design-system';
import { Box } from './layout/Box';
import { useWallet } from '../hooks/useWallet';
import { NoirService } from '../services/NoirService';
import { StellarContractService } from '../services/StellarContractService';
import slice from '../contracts/slice';
import { Buffer } from 'buffer';
import { sha256 } from '@noble/hashes/sha2.js';

// Helper to generate a random 31-byte hex salt (cómodo para Noir Field)
// Luego lo vamos a left-pad a 32 bytes para el SHA256 del contrato
const generateRandomSalt = () => {
  const array = new Uint8Array(31);
  crypto.getRandomValues(array);
  return (
    '0x' +
    Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  );
};

export const VoteComponent: React.FC = () => {
  const { address, signTransaction } = useWallet();
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [salt, setSalt] = useState<string>(() => generateRandomSalt());
  const [disputeId, setDisputeId] = useState<string>('1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<string>('');

  const noirService = useRef(new NoirService());

  const handleVoteSelect = (vote: number) => {
    setSelectedVote(vote);
    setSalt(generateRandomSalt());
    setOutput('');
  };

  const generateAndSubmitVote = useCallback(async () => {
    if (!address || !signTransaction) {
      setOutput('Error: Please connect your wallet first.');
      return;
    }

    if (selectedVote === null) {
      setOutput('Error: Please select a vote option.');
      return;
    }

    setIsGenerating(true);
    setOutput('Computing SHA256 commitment and submitting vote...');

    try {
      slice.options.publicKey = address;

      // -------------------------------------------------------------
      // 1. COMPUTE COMMITMENT = SHA256(vote.to_be_bytes() || salt[32])
      // -------------------------------------------------------------
      const voteBytes = new Uint8Array(4);
      new DataView(voteBytes.buffer).setUint32(0, selectedVote, false);

      const saltHex = salt.replace(/^0x/, '');
      const saltRaw = Buffer.from(saltHex, 'hex');
      const saltBuf32 = Buffer.alloc(32);
      saltRaw.copy(saltBuf32, 32 - saltRaw.length);

      const preimage = new Uint8Array(36);
      preimage.set(voteBytes, 0);
      preimage.set(saltBuf32, 4);

      const commitmentBytes = sha256(preimage);
      const commitmentBuf = Buffer.from(commitmentBytes);

      // MUST BE 32 bytes
      const commitmentBuf32 = Buffer.alloc(32);
      commitmentBuf.copy(commitmentBuf32);

      // -------------------------------------------------------------
      // 2. COMMIT
      // -------------------------------------------------------------
      const walletSignTransaction = async (xdr: string) => {
        const signed = await signTransaction(xdr);
        return {
          signedTxXdr: signed.signedTxXdr,
          signerAddress: signed.signerAddress ?? address,
        };
      };

      const commitTx = await slice.commit_vote({
        caller: address,
        dispute_id: BigInt(disputeId),
        commitment: commitmentBuf32,
      });

      const commitRes = await commitTx.signAndSend({
        signTransaction: walletSignTransaction,
      });

      const commitTxData = StellarContractService.extractTransactionData(commitRes);
      if (!commitTxData.success) throw new Error('commit failed');

      // -------------------------------------------------------------
      // 3. REVEAL — GENERATE ZK PROOF
      // -------------------------------------------------------------
      const revealInputs = {
        vote: selectedVote,
      };

      const revealProof = await noirService.current.generateProof('reveal', revealInputs);

      const vkJsonBuffer = StellarContractService.toBuffer(revealProof.vkJson);
      const proofBlobBuffer = StellarContractService.toBuffer(revealProof.proofBlob);

      // -------------------------------------------------------------
      // 4. SEND reveal_vote
      // -------------------------------------------------------------
      const revealTx = await slice.reveal_vote({
        caller: address,
        dispute_id: BigInt(disputeId),
        vote: selectedVote,
        salt: saltBuf32,
        vk_json: vkJsonBuffer,
        proof_blob: proofBlobBuffer,
      });

      const revealRes = await revealTx.signAndSend({
        signTransaction: walletSignTransaction,
      });

      const revealTxData = StellarContractService.extractTransactionData(revealRes);

      if (!revealTxData.success) throw new Error('reveal failed');

      setOutput((prev) => prev + '\n✓ Vote revealed!');
    } catch (err: any) {
      console.error(err);
      setOutput((prev) => prev + `\n❌ Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  }, [address, signTransaction, selectedVote, salt, disputeId]);

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
            variant={selectedVote === 0 ? 'primary' : 'secondary'}
            onClick={() => handleVoteSelect(0)}
            disabled={isGenerating}
            size="md"
          >
            Vote Party A (0)
          </Button>

          <Button
            variant={selectedVote === 1 ? 'primary' : 'secondary'}
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
            style={{ background: '#f3f4f6', padding: 10, borderRadius: 4 }}
          >
            <Text size="xs" weight="bold">
              Generated Secret Salt:
            </Text>
            <Code size="sm" style={{ wordBreak: 'break-all' }}>
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
          {isGenerating ? 'Submitting...' : 'Generate Proof & Vote'}
        </Button>

        {output && (
          <div
            style={{
              marginTop: 10,
              padding: 15,
              background: '#2c3e50',
              color: '#fff',
              borderRadius: 4,
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: 12,
            }}
          >
            {output}
          </div>
        )}
      </Box>
    </Card>
  );
};
