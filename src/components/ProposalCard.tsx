import React, { useState, useEffect } from 'react';
import { Text, Button } from '@stellar/design-system';
import { Box } from './layout/Box';
import { Proposal, votingService } from '../services/VotingService';
import { VoteForm } from './VoteForm';
import { RevealForm } from './RevealForm';

interface ProposalCardProps {
  proposal: Proposal;
  onUpdate: () => void;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({ proposal, onUpdate }) => {
  const [voteCounts, setVoteCounts] = useState<{ [key: number]: number }>({});
  const [showVoteForm, setShowVoteForm] = useState(false);
  const [showRevealForm, setShowRevealForm] = useState(false);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [currentLedger, setCurrentLedger] = useState<number>(0);

  const isVotingPhase = currentLedger <= proposal.deadline;
  const isRevealPhase = currentLedger > proposal.deadline;

  useEffect(() => {
    void loadVoteCounts();
    // Update current ledger periodically (in real app, would poll network)
    // For now, using a simple estimate
    setCurrentLedger(Math.floor(Date.now() / 1000)); // Rough estimate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposal.id]);

  const loadVoteCounts = async () => {
    setIsLoadingCounts(true);
    try {
      const count0 = await votingService.getVoteCount(proposal.id, 0);
      const count1 = await votingService.getVoteCount(proposal.id, 1);
      setVoteCounts({ 0: count0, 1: count1 });
    } catch (error) {
      console.error('Failed to load vote counts:', error);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  const handleVoteSuccess = () => {
    setShowVoteForm(false);
    onUpdate();
  };

  const handleRevealSuccess = () => {
    setShowRevealForm(false);
    void loadVoteCounts();
    onUpdate();
  };

  return (
    <Box
      gap="md"
      direction="column"
      style={{
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
      }}
    >
      <Box gap="sm" direction="column">
        <Text as="h3" size="lg" style={{ margin: 0 }}>
          Proposal #{proposal.id}
        </Text>
        <Text as="p" size="md" style={{ margin: 0, color: '#4b5563' }}>
          {proposal.description}
        </Text>
      </Box>

      <Box gap="xs" direction="column">
        <Text as="p" size="sm" style={{ margin: 0, color: '#6b7280' }}>
          Creator: {proposal.creator.slice(0, 8)}...
        </Text>
        <Text as="p" size="sm" style={{ margin: 0, color: '#6b7280' }}>
          Deadline: Ledger {proposal.deadline}
        </Text>
        <Text
          as="p"
          size="sm"
          style={{
            margin: 0,
            color: isVotingPhase ? '#059669' : '#dc2626',
            fontWeight: 'bold',
          }}
        >
          Status: {isVotingPhase ? 'Voting Phase' : 'Reveal Phase'}
        </Text>
      </Box>

      {/* Vote Counts */}
      {isRevealPhase && (
        <Box gap="md" direction="row" align="center">
          <Box gap="xs" direction="column">
            <Text as="p" size="sm" style={{ margin: 0, color: '#6b7280' }}>
              Votes Against (0):
            </Text>
            <Text as="p" size="lg" style={{ margin: 0, fontWeight: 'bold' }}>
              {isLoadingCounts ? '...' : voteCounts[0] || 0}
            </Text>
          </Box>
          <Box gap="xs" direction="column">
            <Text as="p" size="sm" style={{ margin: 0, color: '#6b7280' }}>
              Votes For (1):
            </Text>
            <Text as="p" size="lg" style={{ margin: 0, fontWeight: 'bold' }}>
              {isLoadingCounts ? '...' : voteCounts[1] || 0}
            </Text>
          </Box>
        </Box>
      )}

      {/* Actions */}
      <Box gap="sm" direction="row" wrap="wrap">
        {isVotingPhase && (
          <>
            {!showVoteForm && (
              <Button
                onClick={() => setShowVoteForm(true)}
                variant="primary"
                size="md"
              >
                Vote
              </Button>
            )}
            {!showRevealForm && (
              <Button
                onClick={() => setShowRevealForm(true)}
                variant="secondary"
                size="md"
              >
                Reveal Vote
              </Button>
            )}
          </>
        )}
        {isRevealPhase && (
          <>
            {!showRevealForm && (
              <Button
                onClick={() => setShowRevealForm(true)}
                variant="primary"
                size="md"
              >
                Reveal Vote
              </Button>
            )}
            <Button
              onClick={() => { void loadVoteCounts(); }}
              variant="secondary"
              size="md"
              disabled={isLoadingCounts}
            >
              {isLoadingCounts ? 'Loading...' : 'Refresh Counts'}
            </Button>
          </>
        )}
      </Box>

      {/* Vote Form */}
      {showVoteForm && (
        <VoteForm
          proposalId={proposal.id}
          onSuccess={handleVoteSuccess}
          onCancel={() => setShowVoteForm(false)}
        />
      )}

      {/* Reveal Form */}
      {showRevealForm && (
        <RevealForm
          proposalId={proposal.id}
          onSuccess={handleRevealSuccess}
          onCancel={() => setShowRevealForm(false)}
        />
      )}
    </Box>
  );
};


