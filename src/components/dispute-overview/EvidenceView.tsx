"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { DisputeOverviewHeader } from "@/components/dispute-overview/DisputeOverviewHeader";
import { DeadlineCard } from "@/components/dispute-overview/DeadlineCard";
import { ClaimantInfoCard } from "@/components/claimant-evidence/ClaimantInfoCard";
import { DemandDetailSection } from "@/components/claimant-evidence/DemandDetailSection";
import { EvidenceCarousel } from "@/components/claimant-evidence/EvidenceCarousel";
import { EvidenceList } from "@/components/claimant-evidence/EvidenceList";
import { VideoEvidenceList } from "@/components/claimant-evidence/VideoEvidenceList";
import { AudioEvidenceList } from "@/components/claimant-evidence/AudioEvidenceList";
import { PaginationDots } from "@/components/dispute-overview/PaginationDots";
import { useEvidence, EvidenceRole } from "@/hooks/useEvidence";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";

interface EvidenceViewProps {
    disputeId: string;
    role: EvidenceRole;
    nextPath: string;
    prevPath: string;
    pageIndex: number;
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({
    disputeId,
    role,
    nextPath,
    prevPath,
    pageIndex
}) => {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);

    // 1. Get Data
    const {
        partyInfo,
        statement,
        imageEvidence,
        videoEvidence,
        audioEvidence,
        carouselImages
    } = useEvidence(disputeId, role);

    // 2. Get Swipe Handlers
    const { handlers } = useSwipeNavigation({
        onSwipeLeft: () => router.push(nextPath),  // Go forward
        onSwipeRight: () => router.push(prevPath), // Go back
    });

    const handleBack = () => router.back();

    return (
        <div
            ref={containerRef}
            className="flex flex-col h-screen bg-gray-50"
            {...handlers} // Spread touch/mouse events here
        >
            <DisputeOverviewHeader onBack={handleBack} />
            <DeadlineCard deadline="14/12/2025" />

            <div className="flex-1 overflow-y-auto p-4 pb-20">
                {/* We reuse the ClaimantInfoCard but pass dynamic data. 
            You might want to rename this component to 'PartyInfoCard' later. */}
                <ClaimantInfoCard claimant={partyInfo} />

                <DemandDetailSection detail={statement} />

                <EvidenceCarousel images={carouselImages} />

                <div className="flex flex-col gap-4 mt-6">
                    <h3 className="text-md font-bold mb-2 mx-4">Evidence:</h3>
                </div>

                {imageEvidence.length > 0 && <EvidenceList evidenceList={imageEvidence} />}
                {videoEvidence.length > 0 && <VideoEvidenceList evidenceList={videoEvidence} />}
                {audioEvidence && <AudioEvidenceList audio={audioEvidence} />}

                {/* Fallback if no evidence */}
                {imageEvidence.length === 0 && videoEvidence.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        No visual evidence submitted.
                    </div>
                )}
            </div>

            <PaginationDots currentIndex={pageIndex} total={4} />
        </div>
    );
};
