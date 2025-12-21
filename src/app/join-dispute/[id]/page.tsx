"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useAssignDispute } from "@/hooks/useAssignDispute";
import { useGetDispute } from "@/hooks/useGetDispute";
import { Loader2, Gavel, ShieldCheck, ArrowRight } from "lucide-react";
import { CategoryAmountHeader } from "@/components/category-amount/CategoryAmountHeader";
import { formatUnits } from "ethers"; // Import this

export default function JoinDisputePage() {
  const router = useRouter();
  const params = useParams();
  // const searchParams = useSearchParams();

  const disputeId = Number(params?.id);
  // const amount = searchParams.get("amount") || "0.00005";

  // 1. Fetch details for this specific dispute to show preview
  const { dispute, isLoading: isLoadingDispute } = useGetDispute(
    disputeId.toString(),
  );

  // Helper to format the stake for display
  // The hook 'useGetDispute' returns the struct from the contract
  const stakeDisplay = React.useMemo(() => {
    if (!dispute?.requiredStake) return "Loading...";
    // Format 6 decimals for USDC
    return `${formatUnits(dispute.requiredStake, 6)} USDC`;
  }, [dispute]);

  // 2. Hook to execute the join
  const { joinDispute, isLoading: isJoining } = useAssignDispute();

  const handleConfirm = async () => {
    const success = await joinDispute(disputeId);
    if (success) {
      router.push(`/loading-disputes/${disputeId}`);
    }
  };

  if (isLoadingDispute) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-[#8c8fff]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 p-4">
      <CategoryAmountHeader onBack={() => router.back()} />

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
          {/* Header Icon */}
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
            <Gavel className="w-8 h-8 text-indigo-600" />
          </div>

          <h2 className="text-2xl font-extrabold text-[#1b1c23] mb-2">
            Dispute #{disputeId} Found
          </h2>

          <p className="text-sm text-gray-500 mb-6 px-2">
            You have been matched with a case. Review the details below and
            confirm to join the jury.
          </p>

          {/* Details Card */}
          <div className="w-full bg-[#f5f6f9] rounded-xl p-4 flex flex-col gap-3 mb-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <span className="text-xs font-bold text-gray-400 uppercase">
                Category
              </span>
              <span className="text-sm font-bold text-[#1b1c23]">
                {dispute?.category || "General"}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <span className="text-xs font-bold text-gray-400 uppercase">
                Role
              </span>
              <span className="text-sm font-bold text-[#1b1c23] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#8c8fff]" /> Juror
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400 uppercase">
                Stake Required
              </span>
              <span className="text-lg font-extrabold text-[#1b1c23]">
                {/* Use the computed display variable */}
                {stakeDisplay}
              </span>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            disabled={isJoining}
            className="w-full py-4 bg-[#1b1c23] text-white rounded-xl font-manrope font-semibold hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
          >
            {isJoining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Confirming Stake...
              </>
            ) : (
              <>
                Join Jury
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
