"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGetDispute } from "@/hooks/useGetDispute";
import { useSliceVoting } from "@/hooks/useSliceVoting";
import { DisputeOverviewHeader } from "@/components/dispute-overview/DisputeOverviewHeader";
import { TimerCard } from "@/components/dispute-overview/TimerCard";
import { PaginationDots } from "@/components/dispute-overview/PaginationDots";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { useXOContracts } from "@/providers/XOContractsProvider";
import { ArrowRight } from "lucide-react";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

export default function VotePage() {
  const router = useRouter();
  const { address } = useXOContracts();

  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const [hasCommittedLocally, setHasCommittedLocally] = useState(false);

  // 1. Get Dispute ID from URL
  const params = useParams();
  const disputeId = (params?.id as string) || "1";

  // 2. Fetch Dispute State
  const { dispute, refetch } = useGetDispute(disputeId);
  const { commitVote, revealVote, isProcessing, logs } = useSliceVoting();

  const handleBack = () => {
    router.back();
  };

  const { handlers } = useSwipeGesture({
    onSwipeRight: () => {
      // Swipe Right -> Go back to Defendant Evidence
      router.push(`/defendant-evidence/${disputeId}`);
    },
    // onSwipeLeft is undefined because there is no page to the right of "Vote"
  });

  useEffect(() => {
    if (typeof window !== "undefined" && address) {
      const stored = localStorage.getItem(`slice_vote_${disputeId}_${address}`);
      if (stored) {
        setHasCommittedLocally(true);
      }
    }
  }, [address, disputeId]); // Dependencies

  const handleVoteSelect = (vote: number) => {
    setSelectedVote(vote);
    setMessage(null);
  };

  const handleCommit = async () => {
    if (selectedVote === null) return;
    const success = await commitVote(disputeId, selectedVote);
    if (success) {
      await refetch();
      setMessage({
        type: "success",
        text: "Vote committed! You can now proceed to the Reveal Page.",
      });
    }
  };

  const handleReveal = async () => {
    const success = await revealVote(disputeId);
    if (success) setShowSuccessAnimation(true);
  };

  const isRevealPhase = dispute?.status === 2;

  const handleAnimationComplete = () => {
    setShowSuccessAnimation(false);
    router.push("/");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50" {...handlers}>
      <DisputeOverviewHeader onBack={handleBack} />
      <TimerCard />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold mb-4">Vote</h2>
          <div className="flex flex-col gap-3">
            <button
              className={`w-full p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors text-left ${
                selectedVote === 1
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "border-gray-200"
              }`}
              onClick={() => handleVoteSelect(1)}
              disabled={isProcessing || isRevealPhase}
            >
              <div className="flex flex-col">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-semibold">
                      Claimant
                    </span>
                    <span className="text-lg font-medium">Julio Banegas</span>
                  </div>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">
                    1
                  </span>
                </div>
              </div>
            </button>

            <button
              className={`w-full p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors text-left ${
                selectedVote === 0
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "border-gray-200"
              }`}
              onClick={() => handleVoteSelect(0)}
              disabled={isProcessing || isRevealPhase}
            >
              <div className="flex flex-col">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-semibold">
                      Defendant
                    </span>
                    <span className="text-lg font-medium">
                      Micaela Descotte
                    </span>
                  </div>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">
                    0
                  </span>
                </div>
              </div>
            </button>
          </div>

          {message && (
            <div
              className={`p-3 rounded-md text-sm ${
                message.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          {isProcessing && (
            <div
              style={{
                padding: "10px",
                background: "#f3f4f6",
                fontSize: "10px",
                marginBottom: "10px",
                whiteSpace: "pre-wrap",
              }}
            >
              {logs || "Initializing..."}
            </div>
          )}

          {isRevealPhase ? (
            <button
              className="w-full py-3 px-4 bg-primary text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              onClick={() => void handleReveal()}
              disabled={isProcessing || !hasCommittedLocally}
            >
              {isProcessing ? "Revealing..." : "Reveal My Vote"}
            </button>
          ) : (
            <button
              className="w-full py-3 px-4 bg-primary text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              onClick={() => void handleCommit()}
              disabled={isProcessing || selectedVote === null}
            >
              {isProcessing ? "Committing..." : "Commit Vote"}
            </button>
          )}

          {hasCommittedLocally && (
            <button
              onClick={() => router.push(`/reveal/${disputeId}`)}
              className="mt-4 w-full py-3 px-4 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <span>Go to Reveal Page</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <PaginationDots currentIndex={3} total={4} />
      {showSuccessAnimation && (
        <SuccessAnimation onComplete={handleAnimationComplete} />
      )}
    </div>
  );
}
