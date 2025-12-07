"use client";

import React, { useRef, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DisputeOverviewHeader } from "@/components/dispute-overview/DisputeOverviewHeader";
import { DeadlineCard } from "@/components/dispute-overview/DeadlineCard";
import { DisputeInfoCard } from "@/components/dispute-overview/DisputeInfoCard";
import { PaginationDots } from "@/components/dispute-overview/PaginationDots";
import { useGetDispute } from "@/hooks/useGetDispute";

const formatDate = (seconds: bigint) => {
  if (!seconds) return "---";
  // Solidity timestamps are in seconds, JS needs milliseconds
  return new Date(Number(seconds) * 1000).toLocaleDateString();
};

export default function DisputeOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const disputeId = (params?.id as string) || "1";
  const { dispute } = useGetDispute(disputeId);

  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const isDragging = useRef(false);

  const handleBack = () => {
    router.push("/disputes");
  };

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (direction === "right") {
        // Navigate to claimant evidence (screen 1 of carousel)
        router.push(`/claimant-evidence/${disputeId}`);
      }
    },
    [router, disputeId],
  );

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
          handleSwipe("right");
        }
      }

      startX.current = null;
      startY.current = null;
      isDragging.current = false;
    },
    [handleSwipe],
  );

  // Mouse events for desktop development
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    startX.current = e.clientX;
    startY.current = e.clientY;
    isDragging.current = true;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (
      !isDragging.current ||
      startX.current === null ||
      startY.current === null
    )
      return;
    e.preventDefault();
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
          handleSwipe("right");
        }
      }

      startX.current = null;
      startY.current = null;
      isDragging.current = false;
    },
    [handleSwipe],
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

  // Use real dispute data if available, otherwise fallback to mock
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
        generalContext: "Dispute context from blockchain...",
        creationDate: "14/08/2026", // Mock date
        deadline: formatDate(dispute.deadline_commit_seconds),
      }
    : {
        id: "1",
        title: "Stellar Community Fund",
        logo: "/images/icons/stellar-fund-icon.svg",
        category: "Crowdfunding",
        actors: [
          {
            name: "Julio Banegas",
            role: "Claimer" as const,
            avatar: "/images/profiles-mockup/profile-1.png",
          },
          {
            name: "Micaela Descotte",
            role: "Defender" as const,
            avatar: "/images/profiles-mockup/profile-2.png",
          },
        ],
        generalContext:
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
        creationDate: "14/08/2026",
        deadline: "19/08/2026",
        deadlineDate: "19/08/2026", // Added for compatibility if needed
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
      <DeadlineCard deadline={displayDispute.deadline} />
      <DisputeInfoCard dispute={displayDispute} />
      <PaginationDots currentIndex={0} total={4} />
    </div>
  );
}
