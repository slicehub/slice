"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DisputeCard } from "./DisputeCard";
import { BarChartIcon } from "./icons/Icon";
import { FilterIcon } from "./icons/BadgeIcons";
import { Gavel, Eye } from "lucide-react";
import { useXOContracts } from "@/providers/XOContractsProvider";
import { useSliceContract } from "@/hooks/useSliceContract";
import { fetchJSONFromIPFS } from "@/util/ipfs";

export interface Dispute {
  id: string;
  title: string;
  icon?: string;
  category: string;
  votesCount: number;
  totalVotes: number;
  prize: string;
  status: number; // Added: 0=Created, 1=Commit, 2=Reveal, 3=Finished
  userVote?: "approve" | "reject";
  voters: Array<{
    name: string;
    avatar?: string;
    vote: "approve" | "reject";
  }>;
}

export const DisputesList: React.FC = () => {
  const router = useRouter();
  const { address } = useXOContracts();
  const contract = useSliceContract();
  const [myDisputes, setMyDisputes] = useState<Dispute[]>([]);
  // 2. Track the full active dispute object, not just ID
  const [activeDispute, setActiveDispute] = useState<Dispute | null>(null);

  useEffect(() => {
    const loadMyDisputes = async () => {
      if (!contract || !address) return;

      try {
        const jurorIds = await contract.getJurorDisputes(address);

        const loaded = await Promise.all(
          jurorIds.map(async (idBg: bigint) => {
            const id = idBg.toString();
            const d = await contract.disputes(id);

            let title = `Dispute #${id}`;
            if (d.ipfsHash) {
              const meta = await fetchJSONFromIPFS(d.ipfsHash);
              if (meta) {
                title = meta.title || title;
              }
            }

            return {
              id,
              title,
              category: d.category,
              votesCount: 0,
              totalVotes: Number(d.jurorsRequired),
              prize: "Rewards Pending",
              status: Number(d.status), // 3. Capture the status
              voters: [],
            };
          }),
        );

        const sorted = loaded.reverse();
        setMyDisputes(sorted);

        if (sorted.length > 0) {
          setActiveDispute(sorted[0]);
        }
      } catch (e) {
        console.error("Error loading disputes", e);
      }
    };

    loadMyDisputes();
  }, [contract, address]);

  const handleJusticeClick = () => {
    router.push("/category-amount");
  };

  // 4. Logic Helper: Is button enabled?
  const canVote = activeDispute && activeDispute.status === 1; // Commit Phase
  const canReveal = activeDispute && activeDispute.status === 2; // Reveal Phase

  return (
    <div className="px-5 mt-10 w-full box-border">
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
          {/* VOTE BUTTON (Only active in Phase 1) */}
          <button
            onClick={() =>
              activeDispute && router.push(`/vote/${activeDispute.id}`)
            }
            disabled={!canVote}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
              canVote
                ? "bg-blue-50 border-blue-100 hover:bg-blue-100 cursor-pointer"
                : "bg-gray-100 border-gray-200 opacity-30 cursor-not-allowed"
            }`}
            title={
              canVote
                ? `Vote on Dispute #${activeDispute?.id}`
                : "Voting not active (Wrong phase)"
            }
          >
            <Gavel
              className={`w-4 h-4 ${canVote ? "text-blue-600" : "text-gray-400"}`}
            />
          </button>

          {/* REVEAL BUTTON (Only active in Phase 2) */}
          <button
            onClick={() =>
              activeDispute && router.push(`/reveal/${activeDispute.id}`)
            }
            disabled={!canReveal}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
              canReveal
                ? "bg-purple-50 border-purple-100 hover:bg-purple-100 cursor-pointer"
                : "bg-gray-100 border-gray-200 opacity-30 cursor-not-allowed"
            }`}
            title={
              canReveal
                ? `Reveal for Dispute #${activeDispute?.id}`
                : "Reveal not active (Wrong phase)"
            }
          >
            <Eye
              className={`w-4 h-4 ${canReveal ? "text-purple-600" : "text-gray-400"}`}
            />
          </button>

          <button className="bg-white border-none rounded-[13.5px] px-[14px] py-[6px] flex items-center gap-2 cursor-pointer font-manrope font-extrabold text-[11px] text-[#1b1c23] tracking-[-0.22px] transition-opacity duration-200 hover:opacity-80">
            <span>Filter</span>
            <FilterIcon size={12} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-[25px] mb-10">
        {myDisputes.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
            No disputes found. Join one to get started!
          </div>
        ) : (
          myDisputes.map((dispute) => (
            <DisputeCard key={dispute.id} dispute={dispute} />
          ))
        )}
      </div>

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
