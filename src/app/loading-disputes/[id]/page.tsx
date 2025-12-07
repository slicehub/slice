"use client";

import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function LoadingDisputesPage() {
  const router = useRouter();
  const params = useParams();
  const disputeId = (params?.id as string) || "1";

  useEffect(() => {
    // Reduced to 4000ms (4s) for better UX
    const timer = setTimeout(() => {
      // Navigate to overview of assigned dispute
      router.push(`/disputes/${disputeId}`);
    }, 4000);

    return () => clearTimeout(timer);
  }, [router, disputeId]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="flex flex-col items-center text-center">
        <div className="w-48 h-48 mb-6">
          <video
            src="/animations/loading.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain"
          />
        </div>
        <p className="text-lg font-medium text-gray-600">
          Cargando disputas para ti
        </p>
      </div>
    </div>
  );
}
