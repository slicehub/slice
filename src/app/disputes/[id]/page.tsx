"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { DisputeOverviewHeader } from "@/components/dispute-overview/DisputeOverviewHeader";
import { DeadlineCard } from "@/components/dispute-overview/DeadlineCard";
import { DisputeInfoCard } from "@/components/dispute-overview/DisputeInfoCard";
import { PaginationDots } from "@/components/dispute-overview/PaginationDots";
import { useGetDispute } from "@/hooks/useGetDispute";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { Loader2 } from "lucide-react";

export default function DisputeOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const disputeId = (params?.id as string) || "1";

  const { dispute, isLoading } = useGetDispute(disputeId);

  const handleBack = () => router.back();

  const { handlers } = useSwipeGesture({
    onSwipeLeft: () => {
      router.push(`/claimant-evidence/${disputeId}`);
    },
    onSwipeRight: () => {
      router.push("/disputes");
    },
  });

  // Calculate winner logic
  const isFinished = dispute?.status === 3;
  const winnerAddress = dispute?.winner?.toLowerCase();
  
  const displayDispute = dispute
    ? {
        id: dispute.id.toString(),
        title: dispute.title || `Dispute #${dispute.id}`,
        logo: "/images/icons/stellar-fund-icon.svg",
        category: dispute.category,
        status: ["Created", "Commit", "Reveal", "Executed"][dispute.status] || "Unknown",
        votesCount: 0, // Currently mocked as 0 in other lists, or could be fetched
        totalVotes: dispute.jurors_required,
        actors: [
          {
            name: `${dispute.claimer.slice(0, 6)}...${dispute.claimer.slice(-4)}`,
            role: "Claimer" as const,
            avatar: "/images/profiles-mockup/profile-1.png",
            isWinner: isFinished && winnerAddress === dispute.claimer.toLowerCase()
          },
          {
            name: `${dispute.defender.slice(0, 6)}...${dispute.defender.slice(-4)}`,
            role: "Defender" as const,
            avatar: "/images/profiles-mockup/profile-2.png",
            isWinner: isFinished && winnerAddress === dispute.defender.toLowerCase()
          },
        ],
        generalContext: dispute.description || "No description provided.",
        creationDate: "Recently",
        deadline: dispute.deadline,
      }
    : null;

  return (
    <div className="flex flex-col h-screen bg-gray-50" {...handlers}>
      <DisputeOverviewHeader onBack={handleBack} />

      {isLoading || !displayDispute ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-[#8c8fff] w-8 h-8" />
        </div>
      ) : (
        <>
          <DeadlineCard deadline={displayDispute.deadline} />
          <div className="flex-1 overflow-y-auto">
            <DisputeInfoCard dispute={displayDispute} />
          </div>
          <PaginationDots currentIndex={0} total={4} />
        </>
      )}
    </div>
  );
}