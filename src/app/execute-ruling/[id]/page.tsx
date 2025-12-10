"use client";
import React, { useRef, useCallback, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DisputeInfoCard } from "@/components/dispute-overview/DisputeInfoCard";
import { useGetDispute } from "@/hooks/useGetDispute";
import { useExecuteRuling } from "@/hooks/useExecuteRuling";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { Loader2, Gavel, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ExecuteRulingPage() {
  const router = useRouter();
  const params = useParams();
  const disputeId = (params?.id as string) || "1";

  const { dispute, refetch } = useGetDispute(disputeId);
  const { executeRuling, isExecuting } = useExecuteRuling();
  const [showSuccess, setShowSuccess] = useState(false);

  // Aesthetic: Swipe/Touch Handling
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const isDragging = useRef(false);

  const handleBack = () => {
    router.back();
  };

  const handleExecute = async () => {
    if (!dispute) return;

    if (dispute.status !== 2) {
      // 2 = Reveal Phase
      toast.error("Dispute is not in the Reveal phase yet.");
      return;
    }

    const success = await executeRuling(disputeId);
    if (success) {
      await refetch();
      setShowSuccess(true);
    }
  };

  const handleAnimationComplete = () => {
    setShowSuccess(false);
    router.push("/profile");
  };

  // --- Swipe Logic ---
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  }, []);

  const handleBackCallback = useCallback(() => {
    router.back();
  }, [router]);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current || !startX.current) return;
      const endX = e.changedTouches[0].clientX;
      const deltaX = startX.current - endX;

      // Swipe Right -> Back
      if (deltaX < -50) {
        handleBackCallback();
      }
      isDragging.current = false;
      startX.current = null;
    },
    [handleBackCallback],
  );

  // --- Display Data ---
  const displayDispute = dispute
    ? {
        id: dispute.id.toString(),
        title: `Dispute #${dispute.id}`,
        logo: "/images/icons/stellar-fund-icon.svg",
        category: dispute.category,
        actors: [
          {
            name: dispute.claimer.slice(0, 6) + "...",
            role: "Claimer" as const,
            avatar: "/images/profiles-mockup/profile-1.png",
          },
          {
            name: dispute.defender.slice(0, 6) + "...",
            role: "Defender" as const,
            avatar: "/images/profiles-mockup/profile-2.png",
          },
        ],
        generalContext:
          "The voting phase has concluded. Execute the ruling to tally votes and distribute rewards.",
        creationDate: "N/A",
        deadline: "Ended",
      }
    : null;

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen bg-gray-50 relative overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* 3. NEW STICKY HEADER */}
      <div className="pt-12 px-6 pb-4 bg-white shadow-[0px_2px_4px_0px_rgba(27,28,35,0.02)] z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0 shadow-sm border border-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-[#1b1c23]" />
          </button>
          <h1 className="text-lg font-extrabold text-[#1b1c23] flex items-center gap-2">
            <Gavel className="w-5 h-5 text-[#8c8fff]" />
            Execute Ruling
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {/* Description Section (Moved Title to Header) */}
        <div className="mx-[19px] mt-2">
          <p className="text-sm text-gray-500">
            Tally votes, determine the winner, and distribute stakes.
          </p>
        </div>

        {/* Dispute Card */}
        {displayDispute ? (
          <DisputeInfoCard dispute={displayDispute} />
        ) : (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="animate-spin text-gray-400" />
          </div>
        )}

        {/* Action Section */}
        <div className="mx-[19px] bg-white rounded-[18px] p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center gap-4 mb-24">
          {dispute?.status === 3 ? (
            // Status 3 = Finished
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="#16a34a"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-[#1b1c23]">Ruling Executed</h3>
              <p className="text-xs text-gray-500">
                Winner:{" "}
                {dispute.winner ? `${dispute.winner.slice(0, 6)}...` : "None"}
              </p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-[#f5f6f9] rounded-full flex items-center justify-center mb-2">
                <img
                  src="/images/icons/vote-icon.svg"
                  alt="Vote"
                  className="w-8 h-8 opacity-50"
                />
              </div>
              <div>
                <h3 className="font-bold text-[#1b1c23] mb-1">
                  Ready to Tally
                </h3>
                <p className="text-xs text-gray-500 px-4">
                  This transaction will calculate the final result on-chain.
                </p>
              </div>

              <button
                onClick={() => void handleExecute()}
                disabled={isExecuting || !dispute || dispute.status !== 2}
                className={`
                  w-full py-4 rounded-xl font-manrope font-semibold tracking-tight
                  flex items-center justify-center gap-2 transition-all
                  ${
                    isExecuting || !dispute || dispute.status !== 2
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-[#8c8fff] text-white hover:opacity-90 shadow-lg shadow-[#8c8fff]/30"
                  }
                `}
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  "Execute Ruling"
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {showSuccess && <SuccessAnimation onComplete={handleAnimationComplete} />}
    </div>
  );
}
