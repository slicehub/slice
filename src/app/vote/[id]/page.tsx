"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGetDispute } from "@/hooks/useGetDispute";
import { useSliceContract } from "@/hooks/useSliceContract";
import { useSliceVoting } from "@/hooks/useSliceVoting";
import { getVoteData } from "@/util/votingStorage";
import { DisputeOverviewHeader } from "@/components/dispute-overview/DisputeOverviewHeader";
import { TimerCard } from "@/components/dispute-overview/TimerCard";
import { PaginationDots } from "@/components/dispute-overview/PaginationDots";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { useXOContracts } from "@/providers/XOContractsProvider";
import { ArrowRight, RefreshCw, Eye } from "lucide-react";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { toast } from "sonner";

// Status definitions
const STATUS_COMMIT = 1;
const STATUS_REVEAL = 2;

export default function VotePage() {
  const router = useRouter();
  const { address } = useXOContracts();

  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [hasCommittedLocally, setHasCommittedLocally] = useState(false);

  const params = useParams();
  const disputeId = (params?.id as string) || "1";
  const contract = useSliceContract();

  const { dispute, refetch } = useGetDispute(disputeId);
  const { commitVote, isProcessing, logs } = useSliceVoting();

  const handleBack = () => {
    router.back();
  };

  const { handlers } = useSwipeGesture({
    onSwipeRight: () => {
      router.push(`/defendant-evidence/${disputeId}`);
    },
  });

  // Load vote from local storage
  useEffect(() => {
    // Wait for contract to be ready so we have the address
    if (typeof window !== "undefined" && address && contract && contract.target) {
      const contractAddr = contract.target as string;

      // --- FIX: Use utility ---
      const stored = getVoteData(contractAddr, disputeId, address);

      if (stored) {
        setHasCommittedLocally(true);
        setSelectedVote(stored.vote);
      } else {
        // Reset state if no data found for this specific contract
        setHasCommittedLocally(false);
        setSelectedVote(null);
      }
    }
  }, [address, disputeId, contract]); // Contract dependency ensures re-run on connection

  const handleVoteSelect = (vote: number) => {
    // Prevent changing selection if already committed
    if (hasCommittedLocally) return;
    setSelectedVote(vote);
  };

  const handleCommit = async () => {
    if (selectedVote === null) return;
    const success = await commitVote(disputeId, selectedVote);
    if (success) {
      setHasCommittedLocally(true);
      toast.success("Vote committed! Refreshing status...");
      await handleRefresh();
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const currentStatus = dispute?.status;
  const isRevealPhase = currentStatus === STATUS_REVEAL;
  const isCommitPhase = currentStatus === STATUS_COMMIT;

  const handleAnimationComplete = () => {
    setShowSuccessAnimation(false);
    router.push("/");
  };

  // Commit is disabled if: processing, nothing selected, already committed, or wrong phase
  const isCommitDisabled =
    isProcessing ||
    selectedVote === null ||
    hasCommittedLocally ||
    !isCommitPhase;

  // Reveal nav is disabled if: not in reveal phase
  const isRevealDisabled = !isRevealPhase;

  return (
    <div className="flex flex-col h-screen bg-gray-50" {...handlers}>
      <DisputeOverviewHeader onBack={handleBack} />
      <TimerCard />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-[#1b1c23]">Vote</h2>
            <button
              onClick={() => void handleRefresh()}
              disabled={isRefreshing || isProcessing}
              className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-95 transition-all text-[#8c8fff]"
              title="Check Status"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {/* Claimant Button */}
            <button
              className={`w-full p-4 rounded-xl border bg-white transition-all text-left group ${
                selectedVote === 1
                  ? "border-[#1b1c23] ring-1 ring-[#1b1c23] shadow-md"
                  : "border-gray-100 hover:border-[#1b1c23]/50 shadow-sm"
              } ${hasCommittedLocally && selectedVote !== 1 ? "opacity-50 grayscale" : ""}`}
              onClick={() => handleVoteSelect(1)}
              disabled={hasCommittedLocally} // Always disable interaction after commit
            >
              <div className="flex flex-col">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Claimant
                    </span>
                    <span className="text-base font-bold text-[#1b1c23]">
                      Julio Banegas
                    </span>
                  </div>
                  {/* Vote ID Style */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      selectedVote === 1
                        ? "bg-[#1b1c23] text-white"
                        : "bg-[#f5f6f9] text-gray-400 group-hover:bg-[#1b1c23]/10"
                    }`}
                  >
                    1
                  </div>
                </div>
              </div>
            </button>

            {/* Defendant Button */}
            <button
              className={`w-full p-4 rounded-xl border bg-white transition-all text-left group ${
                selectedVote === 0
                  ? "border-[#1b1c23] ring-1 ring-[#1b1c23] shadow-md"
                  : "border-gray-100 hover:border-[#1b1c23]/50 shadow-sm"
              } ${hasCommittedLocally && selectedVote !== 0 ? "opacity-50 grayscale" : ""}`}
              onClick={() => handleVoteSelect(0)}
              disabled={hasCommittedLocally} // Always disable interaction after commit
            >
              <div className="flex flex-col">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Defendant
                    </span>
                    <span className="text-base font-bold text-[#1b1c23]">
                      Micaela Descotte
                    </span>
                  </div>
                  {/* Vote ID Style */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      selectedVote === 0
                        ? "bg-[#1b1c23] text-white"
                        : "bg-[#f5f6f9] text-gray-400 group-hover:bg-[#1b1c23]/10"
                    }`}
                  >
                    0
                  </div>
                </div>
              </div>
            </button>
          </div>

          {isProcessing && (
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-mono text-gray-500 whitespace-pre-wrap animate-pulse">
              {logs || "Processing transaction..."}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3">
            {/* 1. Commit Button */}
            <button
              className={`
                w-full py-4 px-4 rounded-xl font-semibold transition-all
                flex items-center justify-center gap-2
                ${
                  isCommitDisabled
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#1b1c23] text-white hover:bg-[#2c2d33] shadow-lg active:scale-[0.98]"
                }
              `}
              onClick={() => void handleCommit()}
              disabled={isCommitDisabled}
            >
              {isProcessing ? "Processing..." : "Commit Vote"}
            </button>

            {/* 2. Reveal Navigation Button */}
            <button
              onClick={() => router.push(`/reveal/${disputeId}`)}
              disabled={isRevealDisabled}
              className={`
                  w-full py-4 px-4 rounded-xl font-semibold transition-all
                  flex items-center justify-center gap-2
                  ${
                    isRevealDisabled
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-[#1b1c23] flex justify-center items-center text-white hover:bg-[#2c2d33] shadow-lg active:scale-[0.98]"
                  }
                `}
            >
              <Eye className="w-4 h-4" />
              <span>Go to Reveal Page</span>
              {!isRevealDisabled && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
      <PaginationDots currentIndex={3} total={4} />
      {showSuccessAnimation && (
        <SuccessAnimation onComplete={handleAnimationComplete} />
      )}
    </div>
  );
}
