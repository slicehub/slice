"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSliceVoting } from "@/hooks/useSliceVoting";
import { useConnect } from "@/providers/ConnectProvider";
import { useGetDispute } from "@/hooks/useGetDispute";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { DisputeOverviewHeader } from "@/components/dispute-overview/DisputeOverviewHeader";
import { TimerCard } from "@/components/dispute-overview/TimerCard";
import { PaginationDots } from "@/components/dispute-overview/PaginationDots";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import {
  Clock,
  Lock,
  CheckCircle2,
  User,
  ShieldAlert,
  Eye,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { getVoteData } from "@/util/votingStorage";
import { useSliceContract } from "@/hooks/useSliceContract";

export default function RevealPage() {
  const router = useRouter();
  const params = useParams();
  const disputeId = (params?.id as string) || "1";

  const { address } = useConnect();
  const contract = useSliceContract();
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

  const { handlers } = useSwipeGesture({
    onSwipeRight: () => {
      router.push(`/vote/${disputeId}`);
    },
  });

  // --- Load Local Vote Data ---
  useEffect(() => {
    if (address && contract && contract.target) {
      const contractAddress = contract.target as string;
      const storedData = getVoteData(contractAddress, disputeId, address);

      if (storedData) {
        setLocalVote(storedData.vote);
        setHasLocalData(true);
      } else {
        setHasLocalData(false);
      }
    }
  }, [address, disputeId, contract]);

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

  // --- Helper for Party UI ---
  const getPartyInfo = (role: "claimer" | "defender") => {
    if (role === "claimer") {
      return {
        name: dispute?.claimer ? `${dispute.claimer.slice(0, 6)}...${dispute.claimer.slice(-4)}` : "Julio Banegas",
        roleLabel: "Claimant",
        avatarBg: "bg-[#EFF6FF]",
        iconColor: "text-[#2563EB]",
      };
    }
    return {
      name: dispute?.defender ? `${dispute.defender.slice(0, 6)}...${dispute.defender.slice(-4)}` : "Micaela Descotte",
      roleLabel: "Defendant",
      avatarBg: "bg-[#F3F4F6]",
      iconColor: "text-[#374151]",
    };
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FC]" {...handlers}>
      <DisputeOverviewHeader onBack={() => router.back()} />
      <TimerCard />

      <div className="flex-1 overflow-y-auto p-5 pb-40">
        <div className="flex flex-col h-full max-w-sm mx-auto">

          {/* ---------------- STATE 1: TOO EARLY (Voting Phase) ---------------- */}
          {isTooEarly && (
            <div className="flex flex-col items-center justify-center flex-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center relative">
                <Clock className="w-10 h-10 text-indigo-500" />
                <div className="absolute top-0 right-0 w-6 h-6 bg-indigo-500 rounded-full border-4 border-white" />
              </div>

              <div className="text-center space-y-3 px-2">
                <h3 className="text-xl font-extrabold text-[#1b1c23]">
                  Reveal Window Not Open
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium max-w-[260px] mx-auto">
                  The voting phase is still active. Please wait for the timer to end before revealing your vote.
                </p>
              </div>

              <div className="w-full max-w-[280px] bg-white border border-indigo-100 rounded-2xl p-5 text-center mt-4">
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                  Current Status
                </span>
                <p className="text-sm font-bold text-gray-700 mt-1 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                  Collecting Commitments
                </p>
              </div>
            </div>
          )}

          {/* ---------------- STATE 2: REVEAL OPEN ---------------- */}
          {isRevealOpen && (
            <div className="flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-300 h-full">

              <div className="flex justify-between items-center px-1 mt-2">
                <div>
                  <h2 className="text-xl font-extrabold text-[#1b1c23]">Reveal Vote</h2>
                  <p className="text-[11px] font-semibold text-gray-400">Confirm your secret vote on-chain.</p>
                </div>
                {!hasLocalData && (
                  <div className="bg-red-50 text-red-500 p-2 rounded-lg">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Error / Warning Banner */}
              {!hasLocalData && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-start gap-3 shadow-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-xs uppercase tracking-wide">Missing Local Data</span>
                    <span className="text-xs leading-relaxed opacity-90">
                      No local vote data found. You may have voted on a different device.
                    </span>
                  </div>
                </div>
              )}

              {message && (
                <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-3 ${message.type === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
                  }`}>
                  {message.type === "error" && <AlertTriangle className="w-4 h-4" />}
                  {message.text}
                </div>
              )}

              {/* CARDS GRID */}
              <div className="flex flex-col gap-4 flex-1 justify-center min-h-[300px]">

                {/* CLAIMANT CARD */}
                <RevealCard
                  isSelected={localVote === 1}
                  // If we voted (have data), and this is NOT our vote, fade it out
                  isDimmed={hasLocalData && localVote !== 1}
                  info={getPartyInfo("claimer")}
                  voteIndex={1}
                />

                {/* VS Badge */}
                <div className="relative flex items-center justify-center -my-6 z-10 pointer-events-none opacity-40">
                  <div className="bg-white px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">
                    <span className="text-[9px] font-black text-gray-300 tracking-widest">VS</span>
                  </div>
                </div>

                {/* DEFENDANT CARD */}
                <RevealCard
                  isSelected={localVote === 0}
                  isDimmed={hasLocalData && localVote !== 0}
                  info={getPartyInfo("defender")}
                  voteIndex={0}
                />
              </div>

              {/* Processing Logs */}
              {isProcessing && (
                <div className="mx-auto flex items-center gap-2 text-[10px] font-bold text-[#8c8fff] animate-pulse bg-white px-3 py-1.5 rounded-full shadow-sm mt-2">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>{logs || "Confirming on-chain..."}</span>
                </div>
              )}
            </div>
          )}

          {/* ---------------- STATE 3: FINISHED ---------------- */}
          {isFinished && (
            <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-2 border border-gray-200">
                <Lock className="w-8 h-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-gray-700">Dispute Closed</h3>
                <p className="text-sm text-gray-500 font-medium px-8 max-w-xs mx-auto">
                  The ruling has been executed. Check the main page for results.
                </p>
              </div>
              <button
                onClick={() => router.push(`/disputes/${disputeId}`)}
                className="mt-4 px-6 py-3 bg-white border border-gray-200 text-[#1b1c23] rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-all active:scale-95"
              >
                Return to Overview
              </button>
            </div>
          )}

        </div>
      </div>

      {/* FLOATING ACTION BUTTON (Only visible when Reveal is Open) */}
      {isRevealOpen && (
        <div className="fixed bottom-[85px] left-0 right-0 px-5 z-20 flex justify-center">
          <div className="w-full max-w-sm">
            <button
              className={`
                  w-full py-3.5 px-6 rounded-xl font-bold text-xs tracking-wider transition-all duration-300 shadow-lg
                  flex items-center justify-center gap-2 border-b-4
                  ${isProcessing || !hasLocalData
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed shadow-none"
                  : "bg-[#1b1c23] text-white border-[#000000] hover:-translate-y-0.5 active:translate-y-0 active:border-b-0"
                }
                `}
              onClick={() => void handleReveal()}
              disabled={isProcessing || !hasLocalData}
            >
              <Eye className="w-4 h-4" />
              {isProcessing ? "REVEALING..." : "CONFIRM & REVEAL VOTE"}
            </button>
          </div>
        </div>
      )}

      <PaginationDots currentIndex={3} total={4} />

      {showSuccessAnimation && (
        <SuccessAnimation onComplete={handleAnimationComplete} />
      )}
    </div>
  );
}

// --- REUSABLE CARD COMPONENT (Adapted for Reveal) ---

interface RevealCardProps {
  isSelected: boolean;
  isDimmed: boolean;
  voteIndex: number;
  info: {
    name: string;
    roleLabel: string;
    avatarBg: string;
    iconColor: string;
  };
}

function RevealCard({ isSelected, isDimmed, info, voteIndex }: RevealCardProps) {

  // Style logic
  const containerStyle = isSelected
    ? `border-[#1b1c23] bg-white ring-1 ring-[#1b1c23] shadow-md scale-[1.02] z-10`
    : "border-transparent bg-white shadow-sm";

  const dimStyle = isDimmed ? "opacity-40 grayscale blur-[1px] scale-95" : "";

  return (
    <div
      className={`
        relative w-full rounded-2xl border-2 transition-all duration-500 ease-out
        flex flex-col items-center justify-center py-5 px-4 min-h-[140px]
        ${containerStyle}
        ${dimStyle}
      `}
    >
      {/* "YOUR VOTE" Badge */}
      <div className={`
        absolute top-3 right-3 transition-all duration-300
        ${isSelected ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}>
        <span className="bg-[#1b1c23] text-white text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow-sm flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Your Vote
        </span>
      </div>

      {/* Avatar */}
      <div className={`
        w-14 h-14 rounded-xl ${info.avatarBg} 
        flex items-center justify-center mb-3
        transition-transform duration-300
      `}>
        {voteIndex === 1 ? (
          <User className={`w-7 h-7 ${info.iconColor}`} />
        ) : (
          <ShieldAlert className={`w-7 h-7 ${info.iconColor}`} />
        )}
      </div>

      {/* Text */}
      <div className="flex flex-col items-center text-center gap-0.5">
        <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
          {info.roleLabel}
        </span>
        <span className={`text-lg font-bold transition-colors ${isSelected ? 'text-[#1b1c23]' : 'text-gray-700'}`}>
          {info.name}
        </span>
      </div>

      {/* Subtle BG Overlay for selected */}
      {isSelected && (
        <div className="absolute inset-0 bg-[#1b1c23]/[0.02] pointer-events-none rounded-2xl" />
      )}
    </div>
  );
}