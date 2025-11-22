import React, { useState } from 'react';
import { Button, Text, Input } from '@stellar/design-system';
import { Box } from './layout/Box';
import { useWallet } from '../hooks/useWallet';
import { useVoting } from '../contexts/VotingContext';
import { ProposalCard } from './ProposalCard';

export const Voting: React.FC = () => {
  const { address } = useWallet();
  const { proposals, isLoading, error, createProposal, refreshProposals } = useVoting();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCreateProposal = async () => {
    if (!description.trim()) {
      setMessage({ type: 'error', text: 'Please enter a description' });
      return;
    }

    if (!deadline.trim()) {
      setMessage({ type: 'error', text: 'Please enter a deadline (ledger sequence number)' });
      return;
    }

    const deadlineNum = parseInt(deadline);
    if (isNaN(deadlineNum) || deadlineNum <= 0) {
      setMessage({ type: 'error', text: 'Invalid deadline. Must be a positive ledger sequence number.' });
      return;
    }

    setIsCreating(true);
    setMessage(null);

    try {
      const proposalId = await createProposal(description, deadlineNum);
      if (proposalId) {
        setMessage({
          type: 'success',
          text: `Proposal #${proposalId} created successfully!`,
        });
        setDescription('');
        setDeadline('');
        setShowCreateForm(false);
        setTimeout(() => {
          void refreshProposals();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: 'Failed to create proposal' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to create proposal' });
    } finally {
      setIsCreating(false);
    }
  };

  if (!address) {
    return (
      <Box gap="md" direction="column">
        <Text as="h2" size="lg">
          Anonymous Voting System
        </Text>
        <Text as="p" size="md" style={{ color: '#6b7280' }}>
          Connect your wallet to participate in anonymous voting using zero-knowledge proofs.
        </Text>
      </Box>
    );
  }

  return (
    <Box gap="lg" direction="column">
      <Box gap="md" direction="column">
        <Text as="h2" size="xl" style={{ margin: 0 }}>
          Anonymous Voting System
        </Text>
        <Text as="p" size="md" style={{ color: '#6b7280', margin: 0 }}>
          Participate in anonymous voting using zero-knowledge proofs. Your vote is hidden until you reveal it.
        </Text>
      </Box>

      {error && (
        <Box
          gap="sm"
          style={{
            padding: '1rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
          }}
        >
          <Text as="p" size="sm" style={{ color: '#dc2626', margin: 0 }}>
            {error}
          </Text>
        </Box>
      )}

      {/* Create Proposal */}
      {address && (
        <Box gap="md" direction="column">
          {!showCreateForm ? (
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="primary"
              size="md"
            >
              Create New Proposal
            </Button>
          ) : (
            <Box
              gap="md"
              direction="column"
              style={{
                padding: '1.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#f9fafb',
              }}
            >
              <Text as="h3" size="lg" style={{ margin: 0 }}>
                Create Proposal
              </Text>
              <Box gap="sm" direction="column">
                <Input
                  label="Description"
                  id="description"
                  fieldSize="md"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setMessage(null);
                  }}
                  placeholder="Enter proposal description"
                />
                <Input
                  label="Deadline (Ledger Sequence)"
                  id="deadline"
                  fieldSize="md"
                  value={deadline}
                  onChange={(e) => {
                    setDeadline(e.target.value);
                    setMessage(null);
                  }}
                  placeholder="e.g., 100000"
                  type="number"
                />
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
                    onClick={() => { void handleCreateProposal(); }}
                    disabled={isCreating || !description.trim() || !deadline.trim()}
                    variant="primary"
                    size="md"
                  >
                    {isCreating ? 'Creating...' : 'Create Proposal'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCreateForm(false);
                      setDescription('');
                      setDeadline('');
                      setMessage(null);
                    }}
                    variant="secondary"
                    size="md"
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Proposals List */}
      <Box gap="md" direction="column">
        <Box gap="sm" direction="row" align="center" wrap="wrap">
          <Text as="h3" size="lg" style={{ margin: 0 }}>
            Proposals
          </Text>
          <Button
            onClick={() => { void refreshProposals(); }}
            disabled={isLoading}
            variant="secondary"
            size="sm"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </Box>

        {isLoading && proposals.length === 0 && (
          <Text as="p" size="md" style={{ color: '#6b7280' }}>
            Loading proposals...
          </Text>
        )}

        {!isLoading && proposals.length === 0 && (
          <Text as="p" size="md" style={{ color: '#6b7280' }}>
            No proposals yet. Create one to get started!
          </Text>
        )}

        {proposals.length > 0 && (
          <Box gap="md" direction="column">
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onUpdate={() => { void refreshProposals(); }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

