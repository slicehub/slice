"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DisputeCard } from "./DisputeCard";
import { BarChartIcon } from "./icons/Icon";
import { FilterIcon } from "./icons/BadgeIcons";
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
  status: number;
  voters: any[]; // Simplified for portfolio view
}

export const DisputesList: React.FC = () => {
  const router = useRouter();
  const { address } = useXOContracts();
  const contract = useSliceContract();

  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadDisputes = async () => {
      if (!contract || !address) return;
      setIsLoading(true);
      try {
        const jurorIds = await contract.getJurorDisputes(address);

        const loaded = await Promise.all(
          jurorIds.map(async (idBg: bigint) => {
            const id = idBg.toString();
            const d = await contract.disputes(id);
            let title = `Dispute #${id}`;
            if (d.ipfsHash) {
              const meta = await fetchJSONFromIPFS(d.ipfsHash);
              if (meta?.title) title = meta.title;
            }

            return {
              id,
              title,
              category: d.category,
              votesCount: 0,
              totalVotes: Number(d.jurorsRequired),
              prize: "Rewards Pending",
              status: Number(d.status),
              voters: [],
            };
          }),
        );

        setDisputes(loaded.reverse());
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadDisputes();
  }, [contract, address]);

  // Filter based on Tabs
  const displayedDisputes = disputes.filter((d) => {
    if (activeTab === "active") return d.status < 3; // Created, Commit, Reveal
    return d.status === 3; // Executed/Finished
  });

  return (
    <div className="px-5 mt-8 w-full box-border pb-32">
      {/* TABS */}
      <div className="flex gap-6 border-b border-gray-100 mb-6">
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-3 text-sm font-bold transition-all ${
            activeTab === "active"
              ? "text-[#1b1c23] border-b-2 border-[#1b1c23]"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Active Cases
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 text-sm font-bold transition-all ${
            activeTab === "history"
              ? "text-[#1b1c23] border-b-2 border-[#1b1c23]"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Past History
        </button>
      </div>

      <div className="flex justify-between items-center mb-5 w-full">
        <div className="flex items-center gap-[11px]">
          <div className="w-5 h-5 flex items-center justify-center shrink-0 overflow-hidden rounded-[6px]">
            <BarChartIcon />
          </div>
          <h2 className="font-manrope font-extrabold text-[15px] text-[#1b1c23]">
            {activeTab === "active" ? "Current Portfolio" : "Resolved Cases"}
          </h2>
        </div>
        <button className="bg-white rounded-[13.5px] px-[14px] py-[6px] flex items-center gap-2 font-extrabold text-[11px] text-[#1b1c23] hover:opacity-80">
          <span>Filter</span>
          <FilterIcon size={12} />
        </button>
      </div>

      <div className="flex flex-col gap-[25px] mb-10">
        {isLoading ? (
          <div className="text-center py-10 text-gray-400 text-xs">
            Loading...
          </div>
        ) : displayedDisputes.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
            {activeTab === "active"
              ? "No active cases. Check 'Inbox' for tasks or find new ones."
              : "No history yet."}
          </div>
        ) : (
          displayedDisputes.map((dispute) => (
            <DisputeCard key={dispute.id} dispute={dispute} />
          ))
        )}
      </div>

      <button
        onClick={() => router.push("/category-amount")}
        className="fixed bottom-[90px] left-1/2 -translate-x-1/2 z-40 w-[241px] h-10 bg-white text-[#1b1c23] border-2 border-[#8c8fff] rounded-[14px] shadow-lg font-bold hover:bg-[#8c8fff] hover:text-white flex items-center justify-center transition-all"
      >
        Do Justice, Get Paid
      </button>
    </div>
  );
};
