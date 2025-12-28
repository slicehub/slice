import React, { useState, useMemo } from "react";
import { DisputeCard } from "./DisputeCard";
import { BarChartIcon } from "./icons/Icon";
import { Gavel, Loader2 } from "lucide-react";
import type { Dispute } from "@/hooks/useDisputeList"; // Or new DisputeUI interface

interface Props {
  disputes: Dispute[];
  isLoading: boolean;
  onEarnClick: () => void;
}

export const DisputeListView: React.FC<Props> = ({
  disputes,
  isLoading,
  onEarnClick,
}) => {
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [selectedCategory, _setSelectedCategory] = useState<string | null>(
    null,
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter Logic
  const filteredDisputes = useMemo(() => {
    return disputes.filter((d) => {
      const matchesTab = activeTab === "active" ? d.status < 3 : d.status === 3;
      const matchesCategory = selectedCategory
        ? d.category === selectedCategory
        : true;
      return matchesTab && matchesCategory;
    });
  }, [disputes, activeTab, selectedCategory]);

  return (
    <div className="px-5 mt-8 w-full box-border pb-32 relative">
      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-100 mb-6">
        {["active", "history"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-3 font-semibold capitalize transition-all ${activeTab === tab ? "text-[#1b1c23] border-b-2 border-[#1b1c23]" : "text-gray-400"}`}
          >
            {tab === "active" ? "Active Cases" : "Past History"}
          </button>
        ))}
      </div>

      {/* Header & Filter Row */}
      <div className="flex justify-between items-center mb-5 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-md overflow-hidden">
            <BarChartIcon />
          </div>
          <h2 className="font-extrabold text-[15px]">
            {activeTab === "active" ? "Current Portfolio" : "Resolved Cases"}
          </h2>
        </div>

        {/* Filter UI (Simplified for brevity) */}
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2 font-extrabold text-[11px]"
        >
          Filter {selectedCategory ? `(${selectedCategory})` : ""}
        </button>
        {/* Render Dropdown here if isFilterOpen... */}
      </div>

      {/* List Content */}
      <div className="flex flex-col gap-6 min-h-[300px]">
        {isLoading ? (
          <div className="flex flex-col items-center py-16">
            <Loader2 className="animate-spin text-[#8c8fff]" />
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="text-center py-12">
            <Gavel className="w-9 h-9 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400 font-bold">No cases found</p>
          </div>
        ) : (
          filteredDisputes.map((d) => <DisputeCard key={d.id} dispute={d} />)
        )}
      </div>

      <button
        onClick={onEarnClick}
        className="fixed bottom-[90px] left-1/2 -translate-x-1/2 z-40 w-[241px] h-10 bg-white border-2 border-[#8c8fff] rounded-[14px] font-bold"
      >
        Earn Judging
      </button>
    </div>
  );
};
