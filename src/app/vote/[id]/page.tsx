"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DisputeOverviewHeader } from "@/components/dispute-overview/DisputeOverviewHeader";
import { TimerCard } from "@/components/dispute-overview/TimerCard";
import { PaginationDots } from "@/components/dispute-overview/PaginationDots";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import {
  ArrowRight,
  RefreshCw,
  Eye,
  CheckCircle2,
  User,
  ShieldAlert,
  Lock,
  Scale,
} from "lucide-react";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useVote } from "@/hooks/useVote";

export default function VotePage() {
  const router = useRouter();
  const params = useParams();
  const disputeId = (params?.id as string) || "1";

  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

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
  } = useVote(disputeId);

  const handleBack = () => {
    router.back();
  };

  const { handlers } = useSwipeGesture({
    onSwipeRight: () => {
      router.push(`/defendant-evidence/${disputeId}`);
    },
  });

  const onCommitClick = async () => {
    const success = await handleCommit();
    if (success) {
      // Success handled by toast/state update
    }
  };

  const handleAnimationComplete = () => {
    setShowSuccessAnimation(false);
    router.push("/");
  };

  const getPartyInfo = (role: "claimer" | "defender") => {
    if (role === "claimer") {
      return {
        name: dispute?.claimer
          ? `${dispute.claimer.slice(0, 6)}...${dispute.claimer.slice(-4)}`
          : "Julio Banegas",
        roleLabel: "Claimant",
        avatarBg: "bg-[#EFF6FF]",
        iconColor: "text-[#2563EB]",
      };
    }
    return {
      name: dispute?.defender
        ? `${dispute.defender.slice(0, 6)}...${dispute.defender.slice(-4)}`
        : "Micaela Descotte",
      roleLabel: "Defendant",
      avatarBg: "bg-[#F3F4F6]",
      iconColor: "text-[#374151]",
    };
  };

  const claimerInfo = getPartyInfo("claimer");
  const defenderInfo = getPartyInfo("defender");

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FC]" {...handlers}>
      <DisputeOverviewHeader onBack={handleBack} />
      <TimerCard />

      <div className="flex-1 overflow-y-auto p-5 pb-40">
        {/* Centered Container limiting width */}
        <div className="flex flex-col gap-5 h-full max-w-sm mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center px-2 mt-2">
            <div>
              <h2 className="text-xl font-extrabold text-[#1b1c23]">
                Make your Ruling
              </h2>
              <p className="text-[11px] font-semibold text-gray-400">
                Select the winner below.
              </p>
            </div>
            <button
              onClick={() => void handleRefresh()}
              disabled={isRefreshing || isProcessing}
              className="p-2 rounded-full bg-white border border-gray-100 shadow-sm text-[#8c8fff] active:scale-90 transition-transform"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          {/* CARDS GRID */}
          <div className="flex flex-col gap-4 flex-1 justify-center min-h-[300px]">
            {/* CLAIMANT CARD */}
            <VoteOptionCard
              isSelected={selectedVote === 1}
              isCommitted={hasCommittedLocally}
              onClick={() => handleVoteSelect(1)}
              info={claimerInfo}
              voteIndex={1}
            />

            {/* VS Badge */}
            {selectedVote === null && !hasCommittedLocally && (
              <div className="relative flex items-center justify-center -my-6 z-10 pointer-events-none opacity-40">
                <div className="bg-white px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">
                  <span className="text-[9px] font-black text-gray-300 tracking-widest">
                    VS
                  </span>
                </div>
              </div>
            )}

            {/* DEFENDANT CARD */}
            <VoteOptionCard
              isSelected={selectedVote === 0}
              isCommitted={hasCommittedLocally}
              onClick={() => handleVoteSelect(0)}
              info={defenderInfo}
              voteIndex={0}
            />
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="mx-auto flex items-center gap-2 text-[10px] font-bold text-[#8c8fff] animate-pulse bg-white px-3 py-1.5 rounded-full shadow-sm">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>PROCESSING ON-CHAIN...</span>
            </div>
          )}

          {/* Locked State Notification */}
          {hasCommittedLocally && (
            <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-bottom-2 mx-auto w-full">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#1b1c23]">
                  Vote Secured
                </h4>
                <p className="text-[10px] text-gray-500">
                  Reveal it in the next phase.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-[85px] left-0 right-0 px-5 z-20 flex justify-center">
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {!hasCommittedLocally ? (
            <button
              className={`
                    w-full py-3.5 px-6 rounded-xl font-bold text-xs tracking-wider transition-all duration-300 shadow-lg
                    flex items-center justify-center gap-2 border-b-4
                    ${isCommitDisabled
                  ? "bg-white text-gray-300 border-gray-100 cursor-not-allowed shadow-none"
                  : "bg-[#1b1c23] text-white border-[#000000] hover:-translate-y-0.5 active:translate-y-0 active:border-b-0"
                }
                `}
              onClick={() => void onCommitClick()}
              disabled={isCommitDisabled}
            >
              <Scale className="w-4 h-4" />
              {isProcessing ? "COMMITTING..." : "COMMIT VOTE"}
            </button>
          ) : (
            <button
              onClick={() => router.push(`/reveal/${disputeId}`)}
              disabled={isRevealDisabled}
              className={`
                    w-full py-3.5 px-6 rounded-xl font-bold text-xs tracking-wider transition-all duration-300 shadow-lg
                    flex items-center justify-center gap-2 border-b-4
                    ${isRevealDisabled
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-[#8c8fff] text-white border-[#7073db] hover:-translate-y-0.5"
                }
                    `}
            >
              <Eye className="w-4 h-4" />
              <span>GO TO REVEAL</span>
              {!isRevealDisabled && <ArrowRight className="w-4 h-4" />}
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

// --- CARD COMPONENT ---

interface VoteOptionCardProps {
  isSelected: boolean;
  isCommitted: boolean;
  onClick: () => void;
  voteIndex: number;
  info: {
    name: string;
    roleLabel: string;
    avatarBg: string;
    iconColor: string;
  };
}

function VoteOptionCard({
  isSelected,
  isCommitted,
  onClick,
  info,
  voteIndex,
}: VoteOptionCardProps) {
  const containerStyle = isSelected
    ? `border-[#1b1c23] bg-white ring-1 ring-[#1b1c23] shadow-md scale-[1.02]`
    : "border-transparent bg-white hover:border-gray-200 shadow-sm";

  const disabledStyle =
    isCommitted && !isSelected
      ? "opacity-40 grayscale pointer-events-none"
      : "";

  return (
    <button
      onClick={onClick}
      disabled={isCommitted}
      className={`
        relative w-full rounded-2xl border-2 transition-all duration-300 ease-out group
        flex flex-col items-center justify-center py-5 px-4 min-h-[140px]
        ${containerStyle}
        ${disabledStyle}
      `}
    >
      {/* Checkmark Badge */}
      <div
        className={`
        absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300
        ${isSelected
            ? "bg-[#1b1c23] border-[#1b1c23] scale-100 opacity-100"
            : "border-gray-200 bg-transparent scale-90 opacity-0"
          }
      `}
      >
        <CheckCircle2 className="w-3 h-3 text-white" />
      </div>

      {/* Avatar */}
      <div
        className={`
        w-14 h-14 rounded-xl ${info.avatarBg}
        flex items-center justify-center mb-3
        transition-transform duration-300 group-hover:scale-105
      `}
      >
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
        <span
          className={`text-lg font-bold transition-colors ${isSelected ? "text-[#1b1c23]" : "text-gray-700"}`}
        >
          {info.name}
        </span>
      </div>

      {/* Subtle BG Overlay */}
      {isSelected && (
        <div className="absolute inset-0 bg-[#1b1c23]/[0.02] pointer-events-none rounded-2xl" />
      )}
    </button>
  );
}
