import React, { createContext, use, useCallback, useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { votingService, Proposal } from '../services/VotingService';

interface VotingContextType {
  proposals: Proposal[];
  isLoading: boolean;
  error: string | null;
  loadProposals: () => Promise<void>;
  createProposal: (description: string, deadline: number) => Promise<number | null>;
  refreshProposals: () => Promise<void>;
}

const VotingContext = createContext<VotingContextType | undefined>(undefined);

export const useVoting = () => {
  const context = use(VotingContext);
  if (!context) {
    throw new Error('useVoting must be used within a VotingProvider');
  }
  return context;
};

interface VotingProviderProps {
  children: React.ReactNode;
}

export const VotingProvider: React.FC<VotingProviderProps> = ({ children }) => {
  const { address, signTransaction } = useWallet();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProposals = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loadedProposals: Proposal[] = [];
      
      // Get the last proposal ID to know the maximum range
      const lastProposalId = await votingService.getLastProposalId();
      
      console.log('[VotingContext] lastProposalId:', lastProposalId);
      
      if (lastProposalId === 0) {
        // If last_proposal_id returns 0, fall back to sequential loading
        console.log('[VotingContext] last_proposal_id returned 0, using sequential loading');
        let proposalId = 1;
        let consecutiveFailures = 0;
        const maxFailures = 10; // Stop after 10 consecutive failures

        // Try to load proposals sequentially until we hit consecutive failures
        while (consecutiveFailures < maxFailures) {
          try {
            const proposal = await votingService.getProposal(proposalId);
            if (!proposal) {
              consecutiveFailures++;
            } else {
              loadedProposals.push(proposal);
              consecutiveFailures = 0; // Reset counter on success
            }
            proposalId++;
          } catch (err) {
            console.error(`[VotingContext] Error loading proposal ${proposalId}:`, err);
            consecutiveFailures++;
            proposalId++;
          }
        }
      } else {
        // Load all proposals from 1 to lastProposalId
        // We check each ID even if there are gaps, in case some proposals failed to create
        console.log(`[VotingContext] Loading proposals from 1 to ${lastProposalId}`);
        const loadPromises: Promise<Proposal | null>[] = [];
        for (let proposalId = 1; proposalId <= lastProposalId; proposalId++) {
          loadPromises.push(votingService.getProposal(proposalId));
        }

        const results = await Promise.all(loadPromises);
        
        // Filter out null results (gaps) and add valid proposals
        results.forEach((proposal) => {
          if (proposal) {
            loadedProposals.push(proposal);
          }
        });

        // Sort by ID to ensure correct order (in case of gaps)
        loadedProposals.sort((a, b) => a.id - b.id);
      }

      console.log(`[VotingContext] Loaded ${loadedProposals.length} proposals:`, loadedProposals.map(p => p.id));
      setProposals(loadedProposals);
    } catch (err) {
      console.error('[VotingContext] Failed to load proposals:', err);
      setError(err instanceof Error ? err.message : 'Failed to load proposals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProposal = useCallback(
    async (description: string, deadline: number): Promise<number | null> => {
      if (!address || !signTransaction) {
        setError('Wallet not connected');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const walletSignTransaction = async (xdr: string) => {
          const signed = await signTransaction(xdr);
          return {
            signedTxXdr: signed.signedTxXdr,
            signerAddress: signed.signerAddress ?? address,
          };
        };

        const proposalId = await votingService.createProposal(
          address,
          description,
          deadline,
          walletSignTransaction
        );

        // Reload proposals after creating
        await loadProposals();

        return proposalId;
      } catch (err) {
        console.error('Failed to create proposal:', err);
        setError(err instanceof Error ? err.message : 'Failed to create proposal');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [address, signTransaction, loadProposals]
  );

  const refreshProposals = useCallback(async () => {
    await loadProposals();
  }, [loadProposals]);

  // Load proposals on mount
  useEffect(() => {
    void loadProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <VotingContext
      value={{
        proposals,
        isLoading,
        error,
        loadProposals,
        createProposal,
        refreshProposals,
      }}
    >
      {children}
    </VotingContext>
  );
};

