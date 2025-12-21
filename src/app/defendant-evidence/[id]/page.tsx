"use client";

import React from "react";
import { useParams } from "next/navigation";
import { EvidenceView } from "@/components/dispute-overview/EvidenceView";

export default function DefendantEvidencePage() {
  const params = useParams();
  const disputeId = (params?.id as string) || "1";

  return (
    <EvidenceView
      disputeId={disputeId}
      role="defendant"
      prevPath={`/claimant-evidence/${disputeId}`} // Back to claimant
      nextPath={`/vote/${disputeId}`} // Forward to vote
      pageIndex={2}
    />
  );
}
