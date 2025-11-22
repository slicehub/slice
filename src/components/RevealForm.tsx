import React, { useState, useEffect } from 'react';
import { Button, Text, Input } from '@stellar/design-system';
import { Box } from './layout/Box';
import { useWallet } from '../hooks/useWallet';
import { votingService } from '../services/VotingService';

interface RevealFormProps {
  proposalId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

interface StoredVoteData {
  identitySecret: string;
  salt: string;
  proposalId: number;
  nullifier?: string;
  vote?: number;
}

export const RevealForm: React.FC<RevealFormProps> = ({
  proposalId,
  onSuccess,
  onCancel,
}) => {
  const { address, signTransaction } = useWallet();
  const [storedVote, setStoredVote] = useState<StoredVoteData | null>(null);
  const [vote, setVote] = useState<string>('');
  const [salt, setSalt] = useState<string>('');
  const [nullifier, setNullifier] = useState<string>('');
  const [isRevealing, setIsRevealing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load stored vote data from localStorage
  useEffect(() => {
    if (address) {
      const key = `vote_${address}_${proposalId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const data: StoredVoteData = JSON.parse(stored);
          setStoredVote(data);
          if (data.nullifier) {
            setNullifier(data.nullifier);
          }
          if (data.vote !== undefined) {
            setVote(data.vote.toString());
          }
          if (data.salt) {
            setSalt(data.salt);
          }
        } catch (error) {
          console.error('Failed to parse stored vote:', error);
        }
      }
    }
  }, [address, proposalId]);

  const checkRevealedStatus = async () => {
    if (!nullifier) {
      return;
    }

    // Validate nullifier is a valid hex string (64 chars = 32 bytes)
    // Remove 0x prefix if present
    const cleanNullifier = nullifier.startsWith('0x') ? nullifier.slice(2) : nullifier;
    if (cleanNullifier.length !== 64 || !/^[0-9a-fA-F]+$/.test(cleanNullifier)) {
      // Invalid format, skip check (user might be typing)
      return;
    }

    try {
      const isRevealed = await votingService.isVoteRevealed(proposalId, cleanNullifier);
      if (isRevealed) {
        setMessage({
          type: 'error',
          text: 'This vote has already been revealed',
        });
      }
    } catch {
      // Silently fail - don't spam console with errors during typing
      // console.error('Failed to check reveal status:', error);
    }
  };

  useEffect(() => {
    if (nullifier) {
      void checkRevealedStatus();
       
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nullifier]);

  const handleReveal = async () => {
    if (!address || !signTransaction) {
      setMessage({ type: 'error', text: 'Please connect your wallet' });
      return;
    }

    if (!nullifier || !vote || !salt) {
      setMessage({
        type: 'error',
        text: 'Please provide nullifier, vote, and salt. Check localStorage if you have stored data.',
      });
      return;
    }

    const voteNum = parseInt(vote);
    if (isNaN(voteNum) || (voteNum !== 0 && voteNum !== 1)) {
      setMessage({ type: 'error', text: 'Vote must be 0 or 1' });
      return;
    }

    // Validate nullifier format
    const cleanNullifier = nullifier.startsWith('0x') ? nullifier.slice(2) : nullifier;
    if (cleanNullifier.length !== 64 || !/^[0-9a-fA-F]+$/.test(cleanNullifier)) {
      setMessage({ type: 'error', text: 'Invalid nullifier format. Must be 64 hex characters (32 bytes)' });
      return;
    }

    // Validate salt can be converted to BigInt
    let saltBigInt: bigint;
    try {
      // Try to parse as number first (if it's a decimal string)
      if (/^\d+$/.test(salt)) {
        saltBigInt = BigInt(salt);
      } else {
        // Try as hex string
        const cleanSalt = salt.startsWith('0x') ? salt.slice(2) : salt;
        if (!/^[0-9a-fA-F]+$/.test(cleanSalt)) {
          throw new Error('Invalid salt format');
        }
        saltBigInt = BigInt('0x' + cleanSalt);
      }
    } catch {
      setMessage({ type: 'error', text: 'Invalid salt value. Must be a valid number or hex string' });
      return;
    }

    setIsRevealing(true);
    setMessage(null);

    try {
      const walletSignTransaction = async (xdr: string) => {
        const signed = await signTransaction(xdr);
        return {
          signedTxXdr: signed.signedTxXdr,
          signerAddress: signed.signerAddress ?? address,
        };
      };

      const result = await votingService.revealVote(
        address,
        proposalId,
        cleanNullifier,
        voteNum,
        saltBigInt,
        walletSignTransaction
      );

      if (result.success) {
        setMessage({
          type: 'success',
          text: `Vote revealed successfully! Transaction: ${result.txHash?.slice(0, 16)}...`,
        });
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: 'Failed to reveal vote' });
      }
    } catch (error) {
      console.error('Failed to reveal vote:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to reveal vote',
      });
    } finally {
      setIsRevealing(false);
    }
  };

  if (!address) {
    return (
      <Box gap="sm" direction="column">
        <Text as="p" size="sm" style={{ color: '#6b7280' }}>
          Please connect your wallet to reveal your vote
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
        Reveal Vote for Proposal #{proposalId}
      </Text>

      {storedVote && (
        <Box gap="xs" direction="column">
          <Text as="p" size="sm" style={{ margin: 0, color: '#059669' }}>
            Found stored vote data. Fields have been pre-filled.
          </Text>
        </Box>
      )}

      <Box gap="sm" direction="column">
        <Input
          label="Nullifier"
          id="nullifier"
          fieldSize="md"
          value={nullifier}
          onChange={(e) => {
            setNullifier(e.target.value);
            setMessage(null);
          }}
          placeholder="0x..."
        />
        <Input
          label="Vote (0 or 1)"
          id="vote"
          fieldSize="md"
          value={vote}
          onChange={(e) => {
            setVote(e.target.value);
            setMessage(null);
          }}
          placeholder="0 or 1"
          type="number"
        />
        <Input
          label="Salt"
          id="salt"
          fieldSize="md"
          value={salt}
          onChange={(e) => {
            setSalt(e.target.value);
            setMessage(null);
          }}
          placeholder="Salt value"
        />
      </Box>

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
          onClick={() => { void handleReveal(); }}
          disabled={isRevealing || !nullifier || !vote || !salt}
          variant="primary"
          size="md"
        >
          {isRevealing ? 'Revealing...' : 'Reveal Vote'}
        </Button>
        <Button onClick={onCancel} variant="secondary" size="md">
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

