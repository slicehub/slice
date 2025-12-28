import React from "react";
import { CheckCircle2, Lock, Key } from "lucide-react";

interface DisputeCandidateCardProps {
  type: "vote" | "reveal";
  partyInfo: {
    name: string;
    roleLabel: string;
    avatarUrl: string;
    themeColor: string;
  };
  isSelected: boolean;
  isDimmed?: boolean; // For the reveal page (unselected items)
  isDisabled?: boolean; // For the vote page (already committed)
  onClick?: () => void;
}

export function DisputeCandidateCard({
  type,
  partyInfo,
  isSelected,
  isDimmed = false,
  isDisabled = false,
  onClick,
}: DisputeCandidateCardProps) {
  // Common Styles
  const baseStyles =
    "relative w-full rounded-[24px] p-4 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center gap-4 h-[100px] border";

  const activeStyles = isSelected
    ? "border-[#1b1c23] bg-white ring-2 ring-[#1b1c23] shadow-lg z-10 scale-[1.02]"
    : "border-transparent bg-white shadow-sm hover:shadow-md border-gray-100";

  const dimStyles = isDimmed
    ? "opacity-40 grayscale blur-[0.5px] scale-[0.98]"
    : "opacity-100";
  const disabledStyles = isDisabled
    ? "opacity-60 pointer-events-none"
    : "cursor-pointer";

  return (
    <button
      onClick={onClick}
      disabled={isDisabled || type === "reveal"} // Reveal cards usually aren't clickable
      className={`${baseStyles} ${activeStyles} ${dimStyles} ${disabledStyles}`}
    >
      {/* 1. Avatar */}
      <div className="relative shrink-0">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 overflow-hidden border border-gray-100 flex items-center justify-center">
          <img
            src={partyInfo.avatarUrl}
            alt={partyInfo.roleLabel}
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </div>
        <div
          className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-white shadow-sm whitespace-nowrap bg-${partyInfo.themeColor}-50 text-${partyInfo.themeColor}-600`}
        >
          {partyInfo.roleLabel}
        </div>
      </div>

      {/* 2. Text */}
      <div className="flex-1 text-left">
        <span
          className={`block text-[10px] font-bold uppercase tracking-widest mb-0.5 ${isSelected ? "text-[#1b1c23]" : "text-gray-400"}`}
        >
          {type === "vote"
            ? "Vote For"
            : isSelected
              ? "You Voted For"
              : "Opponent"}
        </span>
        <h3
          className={`text-lg font-extrabold leading-tight ${isSelected ? "text-[#1b1c23]" : "text-gray-700"}`}
        >
          {partyInfo.name}
        </h3>
      </div>

      {/* 3. Icon Logic */}
      <div
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "bg-[#1b1c23] border-[#1b1c23]" : "border-gray-100"}`}
      >
        {type === "vote" && (
          <CheckCircle2
            className={`w-4 h-4 text-white transition-opacity ${isSelected ? "opacity-100" : "opacity-0"}`}
          />
        )}
        {type === "reveal" &&
          (isSelected ? (
            <Key className="w-4 h-4 text-white" />
          ) : (
            <Lock className="w-4 h-4 text-gray-300" />
          ))}
      </div>
    </button>
  );
}
