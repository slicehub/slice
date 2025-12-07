"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGetDispute } from "@/hooks/useGetDispute";
import { useSliceVoting } from "@/hooks/useSliceVoting";
import { DisputeOverviewHeader } from "@/components/dispute-overview/DisputeOverviewHeader";
import { TimerCard } from "@/components/dispute-overview/TimerCard";
import { PaginationDots } from "@/components/dispute-overview/PaginationDots";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { useXOContracts } from "@/providers/XOContractsProvider";

export default function VotePage() {
  const router = useRouter();
  const { address } = useXOContracts();
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const isDragging = useRef(false);
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // 1. Get Dispute ID from URL
  const params = useParams();
  const disputeId = (params?.id as string) || "1";

  // 1. Fetch Dispute State
  const { dispute, refetch } = useGetDispute(disputeId);
  const { commitVote, revealVote, isProcessing, logs } = useSliceVoting();

  const handleBack = () => {
    router.push(`/defendant-evidence/${disputeId}`);
  };

  const handleVoteSelect = (vote: number) => {
    setSelectedVote(vote);
    setMessage(null);
  };

  const handleCommit = async () => {
    if (selectedVote === null) return;
    const success = await commitVote(disputeId, selectedVote);
    if (success) {
      await refetch(); // Refresh dispute status
      setMessage({
        type: "success",
        text: "Vote committed. Waiting for Reveal Phase.",
      });
    }
  };

  const handleReveal = async () => {
    const success = await revealVote(disputeId);
    if (success) setShowSuccessAnimation(true);
  };

  // Check if local storage has a vote for this dispute
  const hasCommittedLocally =
    typeof window !== "undefined"
      ? localStorage.getItem(`slice_vote_${disputeId}_${address}`)
      : null;

  // Determine what to show based on Contract Status (0=Created, 1=Commit, 2=Reveal)
  const isRevealPhase = dispute?.status === 2;

  // Minimum distance to consider a swipe (50px)
  const minSwipeDistance = 50;

  // Touch events
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    isDragging.current = true;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !startX.current) return;
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - startX.current);
    const deltaY = Math.abs(touch.clientY - (startY.current || 0));

    // Solo prevenir scroll si el movimiento es principalmente horizontal
    if (deltaX > deltaY && deltaX > 10) {
      e.preventDefault();
    }
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current || !startX.current || startY.current === null)
        return;

      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      const deltaX = startX.current - endX;
      const deltaY = startY.current - endY;

      // Only consider horizontal swipe if horizontal movement is greater than vertical
      if (
        Math.abs(deltaX) > Math.abs(deltaY) &&
        Math.abs(deltaX) > minSwipeDistance
      ) {
        if (deltaX > 0) {
          // Swipe left (slide left = navigate right)
          // No more pages to the right, do nothing
        } else {
          // Swipe right (slide right = navigate left/back)
          router.push(`/defendant-evidence/${disputeId}`);
        }
      }

      startX.current = null;
      startY.current = null;
      isDragging.current = false;
    },
    [router, disputeId],
  );

  // Mouse events for desktop development
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    startX.current = e.clientX;
    startY.current = e.clientY;
    isDragging.current = true;
  }, []);

  const onMouseMove = useCallback(() => {
    if (
      !isDragging.current ||
      startX.current === null ||
      startY.current === null
    )
      return;
  }, []);

  const onMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current || !startX.current || startY.current === null)
        return;

      const endX = e.clientX;
      const endY = e.clientY;
      const deltaX = startX.current - endX;
      const deltaY = startY.current - endY;

      // Only consider horizontal swipe if horizontal movement is greater than vertical
      if (
        Math.abs(deltaX) > Math.abs(deltaY) &&
        Math.abs(deltaX) > minSwipeDistance
      ) {
        if (deltaX > 0) {
          // Swipe left (slide left = navigate right)
          // Do nothing
        } else {
          // Swipe right (slide right = navigate left/back)
          router.push(`/defendant-evidence/${disputeId}`);
        }
      }

      startX.current = null;
      startY.current = null;
      isDragging.current = false;
    },
    [router, disputeId],
  );

  // Cleanup when component unmounts
  useEffect(() => {
    const handleMouseUpGlobal = () => {
      isDragging.current = false;
      startX.current = null;
      startY.current = null;
    };

    window.addEventListener("mouseup", handleMouseUpGlobal);
    return () => {
      window.removeEventListener("mouseup", handleMouseUpGlobal);
    };
  }, []);

  const handleAnimationComplete = () => {
    setShowSuccessAnimation(false);
    router.push("/");
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen bg-gray-50"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <DisputeOverviewHeader onBack={handleBack} />
      <TimerCard />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold mb-4">Vote</h2>
          <div className="flex flex-col gap-3">
            <button
              className={`w-full p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors text-left ${
                selectedVote === 1
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "border-gray-200"
              }`}
              onClick={() => handleVoteSelect(1)}
              disabled={isProcessing || isRevealPhase}
            >
              <div className="flex flex-col">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-semibold">
                      Claimant
                    </span>
                    <span className="text-lg font-medium">Julio Banegas</span>
                  </div>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">
                    1
                  </span>
                </div>
              </div>
            </button>

            <button
              className={`w-full p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors text-left ${
                selectedVote === 0
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "border-gray-200"
              }`}
              onClick={() => handleVoteSelect(0)}
              disabled={isProcessing || isRevealPhase}
            >
              <div className="flex flex-col">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-semibold">
                      Defendant
                    </span>
                    <span className="text-lg font-medium">
                      Micaela Descotte
                    </span>
                  </div>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">
                    0
                  </span>
                </div>
              </div>
            </button>
          </div>

          {message && (
            <div
              className={`p-3 rounded-md text-sm ${
                message.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Display Logs (ZK proof generation takes time) */}
          {isProcessing && (
            <div
              style={{
                padding: "10px",
                background: "#f3f4f6",
                fontSize: "10px",
                marginBottom: "10px",
                whiteSpace: "pre-wrap",
              }}
            >
              {logs || "Initializing..."}
            </div>
          )}

          {isRevealPhase ? (
            /* REVEAL BUTTON */
            <button
              className="w-full py-3 px-4 bg-primary text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              onClick={() => void handleReveal()}
              disabled={isProcessing || !hasCommittedLocally}
            >
              {isProcessing ? "Revealing..." : "Reveal My Vote"}
            </button>
          ) : (
            /* COMMIT BUTTON */
            <button
              className="w-full py-3 px-4 bg-primary text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              onClick={() => void handleCommit()}
              disabled={isProcessing || selectedVote === null}
            >
              {isProcessing ? "Committing..." : "Commit Vote"}
            </button>
          )}
        </div>
      </div>
      <PaginationDots currentIndex={3} total={4} />
      {showSuccessAnimation && (
        <SuccessAnimation onComplete={handleAnimationComplete} />
      )}
    </div>
  );
}
