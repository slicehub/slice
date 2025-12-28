"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Eye,
  RefreshCw,
  AlertTriangle,
  Clock,
  Lock,
  Gavel,
} from "lucide-react";
import { DisputeOverviewHeader } from "@/components/dispute-overview/DisputeOverviewHeader";
import { TimerCard } from "@/components/dispute-overview/TimerCard";
import { PaginationDots } from "@/components/dispute-overview/PaginationDots";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { DisputeCandidateCard } from "@/components/disputes/DisputeCandidateCard";
import { VsBadge } from "@/components/disputes/VsBadge";
import { useReveal } from "@/hooks/useReveal";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useDisputeParties } from "@/hooks/useDisputeParties";

export default function RevealPage() {
  const router = useRouter();
  const { id: disputeId } = useParams() as { id: string };
  const [showSuccess, setShowSuccess] = useState(false);

  // Hook handles logic & state
  const {
    dispute,
    localVote,
    hasLocalData,
    status,
    revealVote,
    isProcessing,
    logs,
  } = useReveal(disputeId || "1");

  const parties = useDisputeParties(dispute);
  const { handlers } = useSwipeGesture({
    onSwipeRight: () => router.push(`/vote/${disputeId}`),
  });

  const handleRevealClick = async () => {
    if (await revealVote()) setShowSuccess(true);
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
          {/* STATE 1: TOO EARLY */}
          {status.isTooEarly && (
            <div className="flex flex-col items-center justify-center flex-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[400px]">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center relative border border-gray-200">
                <Clock className="w-10 h-10 text-gray-400" />
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-[#1b1c23] rounded-full flex items-center justify-center border-[3px] border-white">
                  <Lock className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div className="text-center space-y-3 px-4">
                <h3 className="text-xl font-extrabold text-[#1b1c23]">
                  Reveal Phase Locked
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed font-bold max-w-[260px] mx-auto">
                  The court is still accepting votes. Please wait for the
                  deadline to pass.
                </p>
              </div>
            </div>
          )}

          {/* STATE 2: REVEAL OPEN */}
          {status.isRevealOpen && (
            <div className="flex flex-col gap-5 h-full animate-in fade-in">
              <div className="flex justify-between items-end px-1 mt-2">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#1b1c23] leading-tight">
                    Reveal
                    <br />
                    Your Vote
                  </h2>
                  <p className="text-xs font-bold text-gray-400 mt-1">
                    Confirm your secret decision on-chain.
                  </p>
                </div>
                {!hasLocalData && (
                  <div className="bg-red-50 text-red-500 p-2 rounded-xl border border-red-100 animate-pulse">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                )}
              </div>

              {!hasLocalData && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-start gap-3 shadow-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-xs uppercase tracking-wide">
                      Missing Secret Keys
                    </span>
                    <span className="text-xs leading-relaxed opacity-90">
                      We couldn't find your local vote data. Did you vote on
                      this device?
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4 relative flex-1">
                <div className="relative z-10">
                  <DisputeCandidateCard
                    type="reveal"
                    partyInfo={parties.claimer}
                    isSelected={localVote === 1}
                    isDimmed={hasLocalData && localVote !== 1}
                  />
                  <VsBadge />
                </div>

                <DisputeCandidateCard
                  type="reveal"
                  partyInfo={parties.defender}
                  isSelected={localVote === 0}
                  isDimmed={hasLocalData && localVote !== 0}
                />
              </div>

              {isProcessing && (
                <div className="mx-auto flex items-center gap-2 text-[10px] font-bold text-[#8c8fff] animate-pulse bg-white px-4 py-2 rounded-full shadow-sm border border-[#8c8fff]/20">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>{logs || "Decrypting & Verifying..."}</span>
                </div>
              )}
            </div>
          )}

          {/* STATE 3: FINISHED */}
          {status.isFinished && (
            <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center animate-in fade-in duration-500 min-h-[400px]">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-2 border border-gray-200">
                <Gavel className="w-10 h-10 text-gray-300" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-[#1b1c23]">
                  Dispute Closed
                </h3>
                <p className="text-xs text-gray-500 font-bold px-8 max-w-xs mx-auto">
                  The ruling has been executed. Check your portfolio for
                  results.
                </p>
              </div>
              <button
                onClick={() => router.push(`/disputes/${disputeId}`)}
                className="mt-4 px-8 py-4 bg-white border border-gray-200 text-[#1b1c23] rounded-2xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-all active:scale-95"
              >
                Return to Overview
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Footer Action */}
      {status.isRevealOpen && (
        <div className="fixed bottom-0 left-0 right-0 p-5 z-20 flex justify-center pb-8 bg-gradient-to-t from-white via-white/95 to-transparent">
          <div className="w-full max-w-sm flex flex-col gap-4">
            <div className="mb-2">
              <PaginationDots currentIndex={3} total={4} />
            </div>
            <button
              onClick={() => void handleRevealClick()}
              disabled={isProcessing || !hasLocalData}
              className={`w-full py-4 px-6 rounded-2xl font-manrope font-semibold tracking-wide transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(27,28,35,0.2)] flex items-center justify-center gap-2 ${isProcessing || !hasLocalData ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none" : "bg-[#1b1c23] text-white hover:scale-[1.02] active:scale-[0.98]"}`}
            >
              {isProcessing ? (
                <>
                  {" "}
                  <RefreshCw className="w-4 h-4 animate-spin" />{" "}
                  <span>REVEALING...</span>{" "}
                </>
              ) : (
                <>
                  {" "}
                  <Eye className="w-4 h-4" /> <span>REVEAL VOTE</span>{" "}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {!status.isRevealOpen && (
        <div className="fixed bottom-8 left-0 right-0 z-20">
          <PaginationDots currentIndex={3} total={4} />
        </div>
      )}

      {showSuccess && <SuccessAnimation onComplete={handleAnimationComplete} />}
    </div>
  );
}
