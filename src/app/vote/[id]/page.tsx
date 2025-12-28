"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { RefreshCw, Scale, Home, Eye, ArrowRight, Lock } from "lucide-react";
import { DisputeOverviewHeader } from "@/components/dispute-overview/DisputeOverviewHeader";
import { TimerCard } from "@/components/dispute-overview/TimerCard";
import { PaginationDots } from "@/components/dispute-overview/PaginationDots";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { DisputeCandidateCard } from "@/components/disputes/DisputeCandidateCard";
import { VsBadge } from "@/components/disputes/VsBadge";
import { useVote } from "@/hooks/useVote";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useDisputeParties } from "@/hooks/useDisputeParties";

export default function VotePage() {
  const router = useRouter();
  const { id: disputeId } = useParams() as { id: string };
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    dispute,
    selectedVote,
    hasCommittedLocally,
    isRefreshing,
    isProcessing,
    isCommitDisabled,
    isRevealDisabled,
    handleVoteSelect,
    handleCommit,
    handleRefresh,
  } = useVote(disputeId || "1");

  const parties = useDisputeParties(dispute);

  const { handlers } = useSwipeGesture({
    onSwipeRight: () => router.push(`/defendant-evidence/${disputeId}`),
  });

  const onCommitClick = async () => {
    const success = await handleCommit();
    if (success) {
      /* Success is typically handled by toast or UI update */
    }
  };

  const handleAnimationComplete = () => {
    setShowSuccess(false);
    router.push("/disputes");
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FC]" {...handlers}>
      {/* 1. Header */}
      <div className="flex-none z-10 bg-[#F8F9FC]/80 backdrop-blur-md">
        <DisputeOverviewHeader onBack={() => router.back()} />
        <TimerCard />
      </div>

      {/* 2. Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-40 pt-2 scrollbar-hide">
        <div className="flex flex-col gap-6 max-w-sm mx-auto h-full">
          {/* Title Area */}
          <div className="flex justify-between items-end px-1 mt-2">
            <div>
              <h2 className="text-2xl font-extrabold text-[#1b1c23] leading-tight">
                Make your
                <br />
                Ruling
              </h2>
              <p className="text-xs font-bold text-gray-400 mt-1">
                Review evidence and select a winner.
              </p>
            </div>
            <button
              onClick={() => void handleRefresh()}
              disabled={isRefreshing || isProcessing}
              className="p-2.5 rounded-full bg-white border border-gray-100 shadow-sm text-[#8c8fff] active:scale-90 transition-transform hover:bg-gray-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          {/* Voting Cards */}
          <div className="flex flex-col gap-5 relative flex-1 min-h-[320px]">
            <div className="relative z-10">
              <DisputeCandidateCard
                type="vote"
                partyInfo={parties.claimer}
                isSelected={selectedVote === 1}
                isDisabled={hasCommittedLocally}
                onClick={() => handleVoteSelect(1)}
              />
              <VsBadge />
            </div>

            <DisputeCandidateCard
              type="vote"
              partyInfo={parties.defender}
              isSelected={selectedVote === 0}
              isDisabled={hasCommittedLocally}
              onClick={() => handleVoteSelect(0)}
            />
          </div>

          {/* Notifications */}
          {isProcessing && (
            <div className="mx-auto flex items-center gap-2 text-[10px] font-bold text-[#8c8fff] animate-pulse bg-white px-4 py-2 rounded-full shadow-sm border border-[#8c8fff]/20">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>SECURING VOTE ON-CHAIN...</span>
            </div>
          )}

          {hasCommittedLocally && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 mx-auto w-full">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-100">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#1b1c23]">
                  Vote Secured
                </h4>
                <p className="text-xs text-gray-500 font-medium leading-tight">
                  Your decision is encrypted. You must reveal it in the next
                  phase.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-white via-white/95 to-transparent z-20 flex justify-center pb-8">
        <div className="w-full max-w-sm flex flex-col gap-4">
          <div className="mb-2">
            <PaginationDots currentIndex={3} total={4} />
          </div>

          {!hasCommittedLocally ? (
            <button
              onClick={() => void onCommitClick()}
              disabled={isCommitDisabled}
              className={`w-full py-4 px-6 rounded-2xl font-manrope font-semibold tracking-wide transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(27,28,35,0.2)] flex items-center justify-center gap-2 ${isCommitDisabled ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none" : "bg-[#1b1c23] text-white hover:scale-[1.02] active:scale-[0.98]"}`}
            >
              {isProcessing ? (
                <>
                  {" "}
                  <RefreshCw className="w-4 h-4 animate-spin" />{" "}
                  <span>COMMITTING...</span>{" "}
                </>
              ) : (
                <>
                  {" "}
                  <Scale className="w-4 h-4" /> <span>COMMIT VOTE</span>{" "}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() =>
                isRevealDisabled
                  ? router.push("/disputes")
                  : router.push(`/reveal/${disputeId}`)
              }
              className={`w-full py-4 px-6 rounded-2xl font-manrope font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${isRevealDisabled ? "bg-white text-[#1b1c23] border border-gray-200 shadow-sm hover:bg-gray-50" : "bg-[#1b1c23] text-white shadow-[0_8px_20px_-6px_rgba(27,28,35,0.2)] hover:scale-[1.02]"}`}
            >
              {isRevealDisabled ? (
                <>
                  {" "}
                  <Home className="w-4 h-4" /> <span>RETURN HOME</span>{" "}
                </>
              ) : (
                <>
                  {" "}
                  <Eye className="w-4 h-4" /> <span>GO TO REVEAL</span>{" "}
                  <ArrowRight className="w-4 h-4" />{" "}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {showSuccess && <SuccessAnimation onComplete={handleAnimationComplete} />}
    </div>
  );
}
