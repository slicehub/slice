import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useGetDispute } from "@/hooks/useGetDispute";
import { useSliceContract } from "@/hooks/useSliceContract";
import { useSliceVoting } from "@/hooks/useSliceVoting";
import { useConnect } from "@/providers/ConnectProvider";
import { getVoteData } from "@/util/votingStorage";

const STATUS_COMMIT = 1;
const STATUS_REVEAL = 2;

export function useVote(disputeId: string) {
  const { address } = useConnect();
  const contract = useSliceContract();

  // Local state
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [hasCommittedLocally, setHasCommittedLocally] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Contract & Data hooks
  const { dispute, refetch } = useGetDispute(disputeId);
  const { commitVote, isProcessing, logs } = useSliceVoting();

  // Load vote from local storage
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      address &&
      contract &&
      contract.target
    ) {
      const contractAddr = contract.target as string;
      const stored = getVoteData(contractAddr, disputeId, address);

      if (stored) {
        setHasCommittedLocally(true);
        setSelectedVote(stored.vote);
      } else {
        setHasCommittedLocally(false);
        setSelectedVote(null);
      }
    }
  }, [address, disputeId, contract]);

  // Actions
  const handleVoteSelect = useCallback(
    (vote: number) => {
      if (hasCommittedLocally) return;
      setSelectedVote((prevVote) => (prevVote === vote ? null : vote));
    },
    [hasCommittedLocally],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [refetch]);

  const handleCommit = useCallback(async () => {
    if (selectedVote === null) return false;

    const success = await commitVote(disputeId, selectedVote);

    if (success) {
      setHasCommittedLocally(true);
      toast.success("Vote committed! Refreshing status...");
      await handleRefresh();
      return true;
    }
    return false;
  }, [disputeId, selectedVote, commitVote, handleRefresh]);

  // Derived State
  const currentStatus = dispute?.status;
  const isCommitPhase = currentStatus === STATUS_COMMIT;
  const isRevealPhase = currentStatus === STATUS_REVEAL;

  const isCommitDisabled =
    isProcessing ||
    selectedVote === null ||
    hasCommittedLocally ||
    !isCommitPhase;

  const isRevealDisabled = !isRevealPhase;

  return {
    // State
    dispute,
    selectedVote,
    hasCommittedLocally,
    isRefreshing,
    isProcessing,
    logs,

    // Status flags
    isCommitPhase,
    isRevealPhase,
    isCommitDisabled,
    isRevealDisabled,

    // Actions
    handleVoteSelect,
    handleCommit,
    handleRefresh,
  };
}
