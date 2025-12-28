import { useState, useEffect } from "react";
import { useSliceConnect } from "@/hooks/useSliceConnect";
import { SLICE_ADDRESS } from "@/config/contracts";
import { useSliceVoting } from "@/hooks/useSliceVoting";
import { useGetDispute } from "@/hooks/useGetDispute";
import { getVoteData } from "@/util/votingStorage";

export function useReveal(disputeId: string) {
  const { address } = useSliceConnect();

  const { revealVote, isProcessing, logs } = useSliceVoting();
  const { dispute } = useGetDispute(disputeId);

  const [localVote, setLocalVote] = useState<number | null>(null);
  const [hasLocalData, setHasLocalData] = useState(false);

  // Status flags
  const status = {
    isTooEarly: dispute ? dispute.status < 2 : true,
    isRevealOpen: dispute ? dispute.status === 2 : false,
    isFinished: dispute ? dispute.status > 2 : false,
  };

  useEffect(() => {
    if (address) {
      const stored = getVoteData(SLICE_ADDRESS, disputeId, address);
      if (stored) {
        setLocalVote(stored.vote);
        setHasLocalData(true);
      } else {
        setHasLocalData(false);
      }
    }
  }, [address, disputeId]);

  return {
    dispute,
    localVote,
    hasLocalData,
    status,
    revealVote: () => revealVote(disputeId),
    isProcessing,
    logs,
  };
}
