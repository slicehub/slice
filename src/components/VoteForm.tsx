import React, { useState, useCallback } from 'react';
import { Button, Text } from '@stellar/design-system';
import { Box } from './layout/Box';
import { useWallet } from '../hooks/useWallet';
import { votingService } from '../services/VotingService';
import {
  generateIdentitySecret,
  generateSalt,
} from '../util/votingUtils';

interface VoteFormProps {
  proposalId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const VoteForm: React.FC<VoteFormProps> = ({
  proposalId,
  onSuccess,
  onCancel,
}) => {
  const { address, signTransaction } = useWallet();
  const [vote, setVote] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [identitySecret, setIdentitySecret] = useState<bigint | null>(null);
  const [salt, setSalt] = useState<bigint | null>(null);

  // Generate identity secret and salt when component mounts or when voting
  const generateSecrets = useCallback(() => {
    const secret = generateIdentitySecret();
    const saltValue = generateSalt();
    setIdentitySecret(secret);
    setSalt(saltValue);
    
    // Store in localStorage for later reveal
    if (address) {
      const key = `vote_${address}_${proposalId}`;
      localStorage.setItem(
        key,
        JSON.stringify({
          identitySecret: secret.toString(),
          salt: saltValue.toString(),
          proposalId,
        })
      );
    }
  }, [address, proposalId]);

  React.useEffect(() => {
    generateSecrets();
  }, [generateSecrets]);

  const handleVote = async () => {
    if (!address || !signTransaction) {
      setMessage({ type: 'error', text: 'Please connect your wallet' });
      return;
    }

    if (vote === null) {
      setMessage({ type: 'error', text: 'Please select a vote option' });
      return;
    }

    if (!identitySecret || !salt) {
      setMessage({ type: 'error', text: 'Failed to generate secrets. Please try again.' });
      generateSecrets();
      return;
    }

    setIsGenerating(true);
    setMessage(null);

    try {
      const walletSignTransaction = async (xdr: string) => {
        const signed = await signTransaction(xdr);
        return {
          signedTxXdr: signed.signedTxXdr,
          signerAddress: signed.signerAddress ?? address,
        };
      };

      const result = await votingService.vote(
        address,
        proposalId,
        vote,
        identitySecret,
        salt,
        walletSignTransaction
      );

      setMessage({
        type: 'success',
        text: `Vote committed successfully! Nullifier: ${result.nullifier.slice(0, 16)}...`,
      });

      // Store nullifier for later reveal
      if (address) {
        const key = `vote_${address}_${proposalId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          const data = JSON.parse(stored);
          data.nullifier = result.nullifier;
          data.vote = vote;
          localStorage.setItem(key, JSON.stringify(data));
        }
      }

      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Failed to vote:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to submit vote',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!address) {
    return (
      <Box gap="sm" direction="column">
        <Text as="p" size="sm" style={{ color: '#6b7280' }}>
          Please connect your wallet to vote
        </Text>
      </Box>
    );
  }

  return (
    <Box
      gap="md"
      direction="column"
      style={{
        padding: '1rem',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#f9fafb',
      }}
    >
      <Text as="h4" size="md" style={{ margin: 0 }}>
        Vote on Proposal #{proposalId}
      </Text>

      <Box gap="sm" direction="column">
        <Text as="p" size="sm" style={{ margin: 0, fontWeight: 'bold' }}>
          Select your vote:
        </Text>
        <Box gap="sm" direction="row">
          <Button
            onClick={() => {
              setVote(0);
              setMessage(null);
            }}
            variant={vote === 0 ? 'primary' : 'secondary'}
            size="md"
          >
            Against (0)
          </Button>
          <Button
            onClick={() => {
              setVote(1);
              setMessage(null);
            }}
            variant={vote === 1 ? 'primary' : 'secondary'}
            size="md"
          >
            For (1)
          </Button>
        </Box>
      </Box>

      {vote !== null && (
        <Box gap="xs" direction="column">
          <Text as="p" size="xs" style={{ margin: 0, color: '#6b7280' }}>
            Selected: {vote === 0 ? 'Against' : 'For'}
          </Text>
          <Text as="p" size="xs" style={{ margin: 0, color: '#6b7280' }}>
            Your vote will be hidden using zero-knowledge proofs. You'll need to reveal it after the voting period ends.
          </Text>
        </Box>
      )}

      {message && (
        <Text
          as="p"
          size="sm"
          style={{
            color: message.type === 'success' ? '#059669' : '#dc2626',
            margin: 0,
          }}
        >
          {message.text}
        </Text>
      )}

      <Box gap="sm" direction="row">
        <Button
          onClick={() => { void handleVote(); }}
          disabled={isGenerating || vote === null}
          variant="primary"
          size="md"
        >
          {isGenerating ? 'Generating Proof...' : 'Submit Vote'}
        </Button>
        <Button onClick={onCancel} variant="secondary" size="md">
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

