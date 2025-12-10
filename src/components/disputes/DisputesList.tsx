"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DisputeCard } from "./DisputeCard";
import { BarChartIcon } from "./icons/Icon";
import { FilterIcon } from "./icons/BadgeIcons";
import styles from "./DisputesList.module.css";
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
        // In a real app, you might check statuses to see which one actually needs a vote.
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
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div className={styles.icon}>
            <BarChartIcon />
          </div>
          <h2 className={styles.title}>My disputes:</h2>
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

          <button className={styles.filterButton}>
            <span>Filter</span>
            <FilterIcon size={12} />
          </button>
        </div>
      </div>

      <div className={styles.disputesContainer}>
        {/* Ideally, we would also filter this list to show the real disputes you joined */}
        {mockDisputes.map((dispute) => (
          <DisputeCard key={dispute.id} dispute={dispute} />
        ))}
      </div>

      <button className={styles.justiceButton} onClick={handleJusticeClick}>
        Make Justice
      </button>
    </div>
  );
};
