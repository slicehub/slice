"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CategoryAmountHeader } from "@/components/category-amount/CategoryAmountHeader";
import { InfoCard } from "@/components/category-amount/InfoCard";
import { SwipeButton } from "@/components/category-amount/SwipeButton";
import { usePayDispute } from "@/hooks/usePayDispute";
import { useGetDispute } from "@/hooks/useGetDispute";
import { useXOContracts } from "@/providers/XOContractsProvider";
import { formatEther } from "ethers"; // Only need formatEther here

export default function PayDisputePage() {
  const router = useRouter();
  const params = useParams();
  const disputeId = (params?.id as string) || "1";

  const { payDispute, isPaying } = usePayDispute();
  const { dispute, refetch } = useGetDispute(disputeId);
  const { address } = useXOContracts();

  // State to hold the formatted ETH value
  const [stakeAmountDisplay, setStakeAmountDisplay] =
    useState<string>("Loading...");

  useEffect(() => {
    if (dispute) {
      // 1. Check Status: If status > 0 (Created), payment is already done
      if (dispute.status > 0) {
        router.replace("/profile");
        return;
      }

      // 2. Format the required stake from Wei (BigInt) to ETH (String)
      // contract returns bigint, e.g. 100000000000000
      // formatEther converts to "0.0001"
      if (dispute.deadline_pay_seconds) {
        // Just checking if object is valid
        const formatted = formatEther(dispute.requiredStake || BigInt(0)); // Handle potential undefined safely
        setStakeAmountDisplay(formatted);
      }
    }
  }, [dispute, disputeId, router]);

  const handleBack = () => {
    router.back();
  };

  const handleSwipeComplete = async () => {
    if (!dispute) return;

    // 3. Pass the EXACT formatted string back to the hook.
    // The hook will run parseEther(stakeAmountDisplay) to send the transaction.
    // This ensures we pay exactly what the contract asked for.
    const success = await payDispute(disputeId, stakeAmountDisplay);

    if (success) {
      refetch(); // Refresh local state
      router.push("/profile");
    }
  };

  // Helper to determine role
  const userRole =
    dispute?.claimer?.toLowerCase() === address?.toLowerCase()
      ? "Claimer"
      : dispute?.defender?.toLowerCase() === address?.toLowerCase()
        ? "Defender"
        : "Observer";

  return (
    <div className="flex flex-col h-screen bg-gray-50 p-4">
      <CategoryAmountHeader onBack={handleBack} />

      <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center text-center mb-4 flex-1">
        {/* Hero Animation */}
        <div className="w-24 h-24 mb-6 bg-gray-50 rounded-full flex items-center justify-center overflow-hidden">
          <video
            src="/animations/money.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>

        <h1 className="text-2xl font-bold mb-2 text-[#1b1c23] font-manrope">
          Fund Dispute #{disputeId}
        </h1>

        <div className="bg-[#F5F6F9] rounded-xl p-4 w-full mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500 font-manrope font-semibold">
              Your Role
            </span>
            <span className="text-sm text-[#1b1c23] font-bold font-manrope">
              {userRole}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 font-manrope font-semibold">
              Required Stake
            </span>
            <span className="text-lg text-[#8c8fff] font-extrabold font-manrope">
              {/* Display the value from the contract */}
              {stakeAmountDisplay} ETH
            </span>
          </div>
        </div>

        <p className="text-gray-500 text-sm mb-auto font-manrope px-4">
          Both parties must deposit the required stake for the dispute to
          proceed to the voting phase.
        </p>
      </div>

      <div className="mb-24">
        <InfoCard />
      </div>

      <div className="fixed bottom-8 left-0 right-0 flex justify-center px-4 z-10">
        {isPaying ? (
          <div className="bg-[#1b1c23] text-white px-6 py-3 rounded-2xl font-manrope font-bold animate-pulse flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing Payment...
          </div>
        ) : (
          <SwipeButton onSwipeComplete={() => void handleSwipeComplete()}>
            Swipe to Fund {stakeAmountDisplay} ETH
          </SwipeButton>
        )}
      </div>
    </div>
  );
}
