"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSliceVoting } from "@/hooks/useSliceVoting";
import { useXOContracts } from "@/providers/XOContractsProvider";

export default function ForceRevealPage() {
  const params = useParams();
  const disputeId = (params?.id as string) || "1";
  const { revealVote, isProcessing, logs } = useSliceVoting();

  const { address } = useXOContracts();

  const router = useRouter();

  const [hasLocalData, setHasLocalData] = useState(false);

  useEffect(() => {
    // Check if we have the salt saved locally
    if (address) {
      const key = `slice_vote_${disputeId}_${address}`;
      const data = localStorage.getItem(key);
      setHasLocalData(!!data);
    }
  }, [address, disputeId]);

  const handleReveal = async () => {
    const success = await revealVote(disputeId);
    if (success) {
      alert("Success!");
      router.push(`/disputes/${disputeId}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Reveal Station</h1>
      <p className="mb-4 text-gray-600">Dispute ID: {disputeId}</p>

      {!hasLocalData ? (
        <div className="bg-red-100 text-red-700 p-4 rounded">
          ⚠️ No local vote data found for this dispute. You cannot reveal if you
          switched devices or cleared cache.
        </div>
      ) : (
        <button
          className="bg-purple-600 text-white py-4 px-8 rounded-xl font-bold text-lg disabled:opacity-50"
          onClick={() => void handleReveal()}
          disabled={isProcessing}
        >
          {isProcessing ? "Revealing on Chain..." : "FORCE REVEAL VOTE"}
        </button>
      )}

      <pre className="mt-4 text-xs bg-gray-100 p-2 w-full overflow-auto">
        {logs}
      </pre>
    </div>
  );
}
