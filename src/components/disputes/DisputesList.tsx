"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { DisputeCard } from "./DisputeCard";
import { BarChartIcon } from "./icons/Icon";
import { FilterIcon } from "./icons/BadgeIcons";
import { useConnect } from "@/providers/ConnectProvider";
import { useSliceContract } from "@/hooks/useSliceContract";
import { fetchJSONFromIPFS } from "@/util/ipfs";
import { Gavel, History, Loader2, X, Check } from "lucide-react";

export interface Dispute {
  id: string;
  title: string;
  icon?: string;
  category: string;
  votesCount: number;
  totalVotes: number;
  prize: string;
  status: number;
  revealDeadline: number;
  voters: any[];
}

export const DisputesList: React.FC = () => {
  const router = useRouter();
  const { address } = useConnect();
  const contract = useSliceContract();

  // --- State ---
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- Filter State ---
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // --- Close filter on click outside ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Fetch Data ---
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
            const category = d.category || "General";
            let title = `Dispute #${id}`;

            if (d.ipfsHash) {
              const meta = await fetchJSONFromIPFS(d.ipfsHash);
              if (meta?.title) title = meta.title;
              // Optional: if IPFS has better category data, use it
              // if (meta?.category) category = meta.category;
            }

            return {
              id,
              title,
              category,
              votesCount: 0,
              totalVotes: Number(d.jurorsRequired),
              prize: "Rewards Pending",
              status: Number(d.status),
              revealDeadline: Number(d.revealDeadline),
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

  // --- Derived Data ---

  // 1. Extract unique categories from ALL disputes (not just filtered ones)
  const availableCategories = useMemo(() => {
    const cats = new Set(disputes.map((d) => d.category));
    return Array.from(cats).filter(Boolean);
  }, [disputes]);

  // 2. Apply Filters
  const displayedDisputes = disputes.filter((d) => {
    // Tab Filter: Status < 3 is Active, Status 3 is History (Executed)
    const matchesTab = activeTab === "active" ? d.status < 3 : d.status === 3;

    // Category Filter
    const matchesCategory = selectedCategory
      ? d.category === selectedCategory
      : true;

    return matchesTab && matchesCategory;
  });

  return (
    <div className="px-5 mt-8 w-full box-border pb-32 relative">
      {/* TABS */}
      <div className="flex gap-6 border-b border-gray-100 mb-6">
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-3 font-semibold transition-all ${
            activeTab === "active"
              ? "text-[#1b1c23] border-b-2 border-[#1b1c23]"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Active Cases
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 font-semibold transition-all ${
            activeTab === "history"
              ? "text-[#1b1c23] border-b-2 border-[#1b1c23]"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Past History
        </button>
      </div>

      <div className="flex justify-between items-center mb-5 w-full z-20 relative">
        <div className="flex items-center gap-[11px]">
          <div className="w-5 h-5 flex items-center justify-center shrink-0 overflow-hidden rounded-[6px]">
            <BarChartIcon />
          </div>
          <h2 className="font-manrope font-extrabold text-[15px] text-[#1b1c23]">
            {activeTab === "active" ? "Current Portfolio" : "Resolved Cases"}
          </h2>
          {selectedCategory && (
            <span className="bg-[#1b1c23] text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-in fade-in zoom-in">
              {selectedCategory}
            </span>
          )}
        </div>

        {/* --- FILTER DROPDOWN --- */}
        <div ref={filterRef} className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`
              rounded-[13.5px] px-[14px] py-[6px] flex items-center gap-2 font-extrabold text-[11px] transition-all
              ${isFilterOpen || selectedCategory ? "bg-[#1b1c23] text-white" : "bg-white text-[#1b1c23] hover:opacity-80"}
            `}
          >
            <span className="text-md">Filter</span>
            {selectedCategory ? (
              <X
                size={12}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCategory(null);
                }}
              />
            ) : (
              <FilterIcon size={12} />
            )}
          </button>

          {/* Popup Menu */}
          {isFilterOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 origin-top-right">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-800 uppercase tracking-wider px-3 py-2">
                  By Category
                </span>

                {availableCategories.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-400 italic">
                    No categories found
                  </div>
                ) : (
                  availableCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(
                          cat === selectedCategory ? null : cat,
                        );
                        setIsFilterOpen(false);
                      }}
                      className={`
                        w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors
                        ${selectedCategory === cat ? "bg-[#f5f6f9] text-[#1b1c23]" : "text-gray-600 hover:bg-gray-50"}
                      `}
                    >
                      {cat}
                      {selectedCategory === cat && (
                        <Check size={12} className="text-[#8c8fff]" />
                      )}
                    </button>
                  ))
                )}

                {selectedCategory && (
                  <>
                    <div className="h-px bg-gray-100 my-1" />
                    <button
                      onClick={() => {
                        setSelectedCategory(null);
                        setIsFilterOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Clear Filter
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-[25px] mb-10 min-h-[300px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#8c8fff] animate-spin" />
            <span className="text-xs text-gray-400 mt-2 font-bold">
              Loading cases...
            </span>
          </div>
        ) : displayedDisputes.length === 0 ? (
          /* --- MODERN EMPTY STATE --- */
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-gray-200">
              {activeTab === "active" ? (
                <Gavel className="w-9 h-9 text-gray-300" />
              ) : (
                <History className="w-9 h-9 text-gray-300" />
              )}
            </div>

            <h3 className="text-[#1b1c23] font-manrope font-extrabold text-base mb-1">
              {selectedCategory
                ? `No ${selectedCategory} Cases`
                : activeTab === "active"
                  ? "No Active Cases"
                  : "No History Yet"}
            </h3>

            <p className="text-gray-400 text-xs font-medium max-w-[220px] leading-relaxed mx-auto">
              {selectedCategory
                ? "Try clearing the filter to see all disputes."
                : activeTab === "active"
                  ? "Check 'Inbox' for tasks or find new ones."
                  : "Past resolved cases will appear here."}
            </p>

            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="mt-4 text-[#8c8fff] text-xs font-bold hover:underline"
              >
                Clear Filters
              </button>
            )}
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
