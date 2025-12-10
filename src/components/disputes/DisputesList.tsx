"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DisputeCard } from "./DisputeCard";
import { BarChartIcon } from "./icons/Icon";
import { FilterIcon } from "./icons/BadgeIcons";
import { Gavel, Eye } from "lucide-react";
import { useXOContracts } from "@/providers/XOContractsProvider";

export interface Dispute {
  id: string;
  title: string;
  icon?: string;
  category: string;
  votesCount: number;
  totalVotes: number;
  prize: string;
  userVote?: "approve" | "reject";
  voters: Array<{
    name: string;
    avatar?: string;
    vote: "approve" | "reject";
  }>;
}

// Mock data - in production would come from the contract
const mockDisputes: Dispute[] = [
  {
    id: "1",
    title: "Stellar Community Fund",
    category: "Crowfunding",
    votesCount: 8,
    totalVotes: 10,
    prize: "$5,000",
    userVote: "reject",
    voters: [
      {
        name: "Julio Banegas",
        avatar: "/images/profiles-mockup/profile-1.png",
        vote: "reject",
      },
      {
        name: "Micaela Descotte",
        avatar: "/images/profiles-mockup/profile-2.png",
        vote: "approve",
      },
    ],
  },
  {
    id: "2",
    title: "Ethereum Fundation",
    category: "Crowfunding",
    votesCount: 8,
    totalVotes: 10,
    prize: "$5,000",
    userVote: "reject",
    voters: [
      {
        name: "Julio Banegas",
        avatar: "/images/profiles-mockup/profile-1.png",
        vote: "reject",
      },
      {
        name: "Micaela Descotte",
        avatar: "/images/profiles-mockup/profile-2.png",
        vote: "approve",
      },
    ],
  },
  {
    id: "3",
    title: "Lionstar",
    category: "Crowfunding",
    votesCount: 8,
    totalVotes: 10,
    prize: "$5,000",
    userVote: "reject",
    voters: [
      {
        name: "Julio Banegas",
        avatar: "/images/profiles-mockup/profile-1.png",
        vote: "reject",
      },
      {
        name: "Micaela Descotte",
        avatar: "/images/profiles-mockup/profile-2.png",
        vote: "approve",
      },
    ],
  },
];

export const DisputesList: React.FC = () => {
  const router = useRouter();
  const { address } = useXOContracts();

  // "activeDisputeId" = The ID this user should probably act on (Vote/Reveal)
  const [activeDisputeId, setActiveDisputeId] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      // 1. READ LOCAL STORAGE: Get all disputes THIS user has joined
      const storageKey = `slice_joined_disputes_${address}`;
      const joinedDisputes: number[] = JSON.parse(
        localStorage.getItem(storageKey) || "[]",
      );

      if (joinedDisputes.length > 0) {
        // 2. FIND MOST RELEVANT: For now, we take the highest ID (latest one joined)
        const myLatestId = Math.max(...joinedDisputes);
        setActiveDisputeId(myLatestId.toString());
      } else {
        setActiveDisputeId(null);
      }
    }
  }, [address]);

  const handleJusticeClick = () => {
    router.push("/category-amount");
  };

  return (
    <div className="px-5 mt-10 w-full box-border">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-5 w-full">
        <div className="flex items-center gap-[11px]">
          <div className="w-5 h-5 flex items-center justify-center shrink-0 overflow-hidden rounded-[6px]">
            <BarChartIcon />
          </div>
          <h2 className="font-manrope font-extrabold text-[15px] leading-none text-[#1b1c23] tracking-[-0.3px] m-0">
            My disputes:
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Vote Button */}
          <button
            onClick={() =>
              activeDisputeId && router.push(`/vote/${activeDisputeId}`)
            }
            disabled={!activeDisputeId}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
              activeDisputeId
                ? "bg-blue-50 border-blue-100 hover:bg-blue-100 cursor-pointer"
                : "bg-gray-100 border-gray-200 opacity-30 cursor-not-allowed"
            }`}
            title={
              activeDisputeId
                ? `Vote on Dispute #${activeDisputeId}`
                : "No active disputes"
            }
          >
            <Gavel
              className={`w-4 h-4 ${activeDisputeId ? "text-blue-600" : "text-gray-400"}`}
            />
          </button>

          {/* Reveal Button */}
          <button
            onClick={() =>
              activeDisputeId && router.push(`/reveal/${activeDisputeId}`)
            }
            disabled={!activeDisputeId}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
              activeDisputeId
                ? "bg-purple-50 border-purple-100 hover:bg-purple-100 cursor-pointer"
                : "bg-gray-100 border-gray-200 opacity-30 cursor-not-allowed"
            }`}
            title={
              activeDisputeId
                ? `Reveal for Dispute #${activeDisputeId}`
                : "No active disputes"
            }
          >
            <Eye
              className={`w-4 h-4 ${activeDisputeId ? "text-purple-600" : "text-gray-400"}`}
            />
          </button>

          {/* Filter Button */}
          <button className="bg-white border-none rounded-[13.5px] px-[14px] py-[6px] flex items-center gap-2 cursor-pointer font-manrope font-extrabold text-[11px] text-[#1b1c23] tracking-[-0.22px] transition-opacity duration-200 hover:opacity-80">
            <span>Filter</span>
            <FilterIcon size={12} />
          </button>
        </div>
      </div>

      {/* Disputes List */}
      <div className="flex flex-col gap-[25px] mb-10">
        {mockDisputes.map((dispute) => (
          <DisputeCard key={dispute.id} dispute={dispute} />
        ))}
      </div>

      {/* Floating Action Button - Corrected Styling */}
      {/* Updated: Uses explicit '#1b1c23' color to match design system exactly.
          Added: hover:text-white to ensure contrast on hover state.
      */}
      <button
        onClick={handleJusticeClick}
        className="
          fixed bottom-[80px] left-1/2 -translate-x-1/2 z-50
          w-[241px] max-w-[calc(100%-76px)] h-10
          bg-white text-[#1b1c23]
          border-2 border-[#8c8fff] rounded-[14px]
          shadow-[0px_0px_10px_0px_rgba(140,143,255,0.5)]
          font-manrope font-semibold tracking-[-0.28px]
          cursor-pointer transition-all duration-200
          hover:bg-[#8c8fff] hover:text-white
          flex items-center justify-center
        "
      >
        Make Justice
      </button>
    </div>
  );
};
