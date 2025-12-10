"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSliceVoting } from "@/hooks/useSliceVoting";
import { useXOContracts } from "@/providers/XOContractsProvider";
import { useGetDispute } from "@/hooks/useGetDispute";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { DisputeOverviewHeader } from "@/components/dispute-overview/DisputeOverviewHeader";
import { TimerCard } from "@/components/dispute-overview/TimerCard";
import { PaginationDots } from "@/components/dispute-overview/PaginationDots";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { Clock } from "lucide-react";

export default function RevealPage() {
  const router = useRouter();
  const params = useParams();
  const disputeId = (params?.id as string) || "1";

  const { address } = useXOContracts();
  const { revealVote, isProcessing, logs } = useSliceVoting();
  const { dispute } = useGetDispute(disputeId);

  // --- State ---
  const [localVote, setLocalVote] = useState<number | null>(null);
  const [hasLocalData, setHasLocalData] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // --- Logic: Determine UI State ---
  const isTooEarly = dispute ? dispute.status < 2 : true;
  const isRevealOpen = dispute ? dispute.status === 2 : false;
  const isFinished = dispute ? dispute.status > 2 : false;

  // --- 1. Swipe Gesture Hook ---
  const { handlers } = useSwipeGesture({
    onSwipeRight: () => {
      // Swipe Right -> Go back to the Vote Page
      router.push(`/vote/${disputeId}`);
    },
  });

  // --- 2. Check for local vote data ---
  useEffect(() => {
    if (address) {
      const key = `slice_vote_${disputeId}_${address}`;
      const dataString = localStorage.getItem(key);
      if (dataString) {
        try {
          const data = JSON.parse(dataString);
          setLocalVote(data.vote);
          setHasLocalData(true);
        } catch (e) {
          console.error("Failed to parse local vote data", e);
        }
      }
    }
  }, [address, disputeId]);

  const handleReveal = async () => {
    const success = await revealVote(disputeId);
    if (success) {
      setShowSuccessAnimation(true);
    } else {
      setMessage({
        type: "error",
        text: "Failed to reveal. Check logs or local data integrity.",
      });
    }
  };

  const handleAnimationComplete = () => {
    setShowSuccessAnimation(false);
    router.push("/disputes");
  };

  return (
    <div
      className="flex flex-col h-screen bg-gray-50"
      {...handlers} // Spread the gesture handlers
    >
      <DisputeOverviewHeader onBack={() => router.back()} />
      <TimerCard />

      <div className="flex-1 overflow-y-auto p-4">
        {/* ---------------- STATE 1: TOO EARLY (Voting Phase) ---------------- */}
        {isTooEarly && (
          <div className="flex flex-col items-center justify-center h-full pb-20 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100 shadow-sm">
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
            <div className="text-center space-y-2 px-6">
              <h3 className="text-xl font-extrabold text-[#1b1c23]">
                Reveal Window Not Open
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                The voting phase is still active. Please wait for the timer to
                end before revealing your vote.
              </p>
            </div>
            <div className="w-full max-w-xs bg-white border border-blue-100 rounded-xl p-4 text-center">
              <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">
                Status
              </span>
              <p className="text-sm font-medium text-gray-700 mt-1">
                Collecting Commitments...
              </p>
            </div>
          </div>
        )}

        {/* ---------------- STATE 2: REVEAL OPEN ---------------- */}
        {isRevealOpen && (
          <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">Reveal Vote</h2>
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold border border-green-200 shadow-sm animate-pulse">
                WINDOW OPEN
              </span>
            </div>

            {!hasLocalData && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl mb-2 flex flex-col gap-1">
                <span className="font-bold flex items-center gap-2">
                  ⚠️ Missing Data
                </span>
                <span>
                  No local vote data found. You cannot reveal if you switched
                  devices or cleared your cache.
                </span>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {/* Claimant Card (Read-Only) */}
              <div
                className={`w-full p-4 rounded-xl border transition-all text-left flex flex-col relative ${
                  localVote === 1
                    ? "border-[#8c8fff] ring-1 ring-[#8c8fff]/50 bg-[#8c8fff]/5"
                    : "border-gray-200 bg-white opacity-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                      Claimant
                    </span>
                    <span className="text-lg font-bold text-[#1b1c23]">
                      Julio Banegas
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                      localVote === 1
                        ? "bg-[#1b1c23] text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    1
                  </span>
                </div>
                {localVote === 1 && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-bold text-[#8c8fff] uppercase tracking-wider bg-white px-2 py-0.5 rounded-full border border-[#8c8fff]/20">
                      Your Vote
                    </span>
                  </div>
                )}
              </div>

              {/* Defendant Card (Read-Only) */}
              <div
                className={`w-full p-4 rounded-xl border transition-all text-left flex flex-col relative ${
                  localVote === 0
                    ? "border-[#8c8fff] ring-1 ring-[#8c8fff]/50 bg-[#8c8fff]/5"
                    : "border-gray-200 bg-white opacity-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                      Defendant
                    </span>
                    <span className="text-lg font-bold text-[#1b1c23]">
                      Micaela Descotte
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                      localVote === 0
                        ? "bg-[#1b1c23] text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    0
                  </span>
                </div>
                {localVote === 0 && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-bold text-[#8c8fff] uppercase tracking-wider bg-white px-2 py-0.5 rounded-full border border-[#8c8fff]/20">
                      Your Vote
                    </span>
                  </div>
                )}
              </div>
            </div>

            {message && (
              <div
                className={`p-3 rounded-xl text-sm font-medium border ${
                  message.type === "success"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            {isProcessing && (
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-mono text-gray-500 whitespace-pre-wrap animate-pulse">
                {logs || "Processing reveal transaction..."}
              </div>
            )}

            <button
              className="w-full py-4 px-4 bg-[#1b1c23] text-white rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg hover:bg-[#2c2d33] transition-colors active:scale-[0.98]"
              onClick={() => void handleReveal()}
              disabled={isProcessing || !hasLocalData}
            >
              {isProcessing ? "Revealing on Chain..." : "Confirm & Reveal Vote"}
            </button>
          </div>
        )}

        {/* ---------------- STATE 3: FINISHED ---------------- */}
        {isFinished && (
          <div className="flex flex-col items-center justify-center h-full pb-20 gap-4 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-lg font-bold text-gray-400">Dispute Closed</h3>
            <p className="text-sm text-gray-400 px-8">
              The ruling has been executed. Check the main page for results.
            </p>
            <button
              onClick={() => router.push(`/disputes/${disputeId}`)}
              className="mt-2 text-[#8c8fff] font-bold text-sm hover:underline"
            >
              View Results
            </button>
          </div>
        )}
      </div>

      <PaginationDots currentIndex={3} total={4} />

      {showSuccessAnimation && (
        <SuccessAnimation onComplete={handleAnimationComplete} />
      )}
    </div>
  );
}
