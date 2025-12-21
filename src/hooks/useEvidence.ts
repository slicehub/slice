import { useGetDispute } from "@/hooks/useGetDispute";

export type EvidenceRole = "claimant" | "defendant";

export function useEvidence(disputeId: string, role: EvidenceRole) {
  const { dispute } = useGetDispute(disputeId);
  const isClaimant = role === "claimant";

  // 1. Party Details
  // Note: In a real app, you'd map 'claimer'/'defender' from the contract to these fields
  const partyInfo = {
    name: isClaimant
      ? dispute?.claimer || "Julio Banegas"
      : dispute?.defender || "Micaela Descotte",
    role: isClaimant ? "Claimant" : "Defendant",
    avatar: isClaimant
      ? "/images/profiles-mockup/profile-1.jpg"
      : "/images/profiles-mockup/profile-2.jpg", // Mock or dynamic
  };

  // 2. Statement / Demand
  const statement = isClaimant
    ? "I was hired to develop a React Native mobile application. The agreed milestone was a functional MVP delivered by October 1st..."
    : "The deliverables provided were incomplete and buggy. The 'MVP' crashed on launch."; // Mock data

  // 3. Evidence Processing
  // In a real scenario, you filter dispute.evidence by submitter.
  // Here we just use the raw list for demonstration.
  const rawEvidence = dispute?.evidence || [];

  const imageEvidence = rawEvidence
    .filter((url: string) => !url.endsWith(".mp4"))
    .map((url: string, i: number) => ({
      id: `img-${i}`,
      type: "image" as const,
      url,
      description: "Evidence submitted",
      uploadDate: "Recently",
    }));

  const videoEvidence = rawEvidence
    .filter((url: string) => url.endsWith(".mp4"))
    .map((url: string, i: number) => ({
      id: `vid-${i}`,
      type: "video" as const,
      url,
      thumbnail: "/images/category-amount/evidencia-video.png",
      description: "Video Evidence",
      uploadDate: "Recently",
    }));

  // Mock Audio (could be null if none)
  const audioEvidence = {
    id: "audio-1",
    title: `${partyInfo.role}'s Audio Statement`,
    duration: "1:45min",
    progress: 0,
  };

  // Mock Carousel Images
  const carouselImages = [
    {
      id: "c1",
      url: "/images/category-amount/evidencia-1.png",
      description: "Exhibit A",
    },
    {
      id: "c2",
      url: "/images/category-amount/evidencia-2.png",
      description: "Exhibit B",
    },
  ];

  return {
    dispute,
    partyInfo,
    statement,
    imageEvidence,
    videoEvidence,
    audioEvidence,
    carouselImages,
  };
}
