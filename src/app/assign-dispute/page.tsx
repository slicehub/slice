"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAssignDispute } from "@/hooks/useAssignDispute";
import { Search } from "lucide-react";
import { CategoryAmountHeader } from "@/components/category-amount/CategoryAmountHeader";

export default function AssignDisputePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const amount = searchParams.get("amount") || "0.00005";

  const { findActiveDispute } = useAssignDispute();
  const [searchFailed, setSearchFailed] = useState(false);
  const hasSearched = useRef(false); // Prevent double-fire in Strict Mode

  useEffect(() => {
    if (hasSearched.current) return;
    hasSearched.current = true;

    const runMatchmaking = async () => {
      setSearchFailed(false);
      // 1. Run the logic to find an ID
      const disputeId = await findActiveDispute();

      if (disputeId) {
        // 2. Found one? Forward to the confirmation page
        router.replace(`/join-dispute/${disputeId}?amount=${amount}`);
      } else {
        setSearchFailed(true);
      }
    };

    runMatchmaking();
  }, [findActiveDispute, router, amount]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 p-4">
      <CategoryAmountHeader onBack={() => router.back()} />

      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        {searchFailed ? (
          /* STATE: FAILED - Only shown if search explicitly fails */
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-2">
              <Search className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-[#1b1c23]">
              No Matches Found
            </h2>
            <p className="text-gray-500 max-w-[260px]">
              We couldn't find an active dispute that needs jurors right now.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-[#1b1c23] text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        ) : (
          /* STATE: LOADING/SEARCHING - Default view */
          <>
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
              <Search className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-[#1b1c23]">
              Finding a Case...
            </h2>
            <p className="text-gray-500 px-8">
              We are searching the blockchain for an active dispute that matches
              your criteria.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
