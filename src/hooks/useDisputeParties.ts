import { useMemo } from "react";

export function useDisputeParties(dispute: any) {
  return useMemo(() => {
    const format = (name: string, fallback: string) =>
      name ? `${name.slice(0, 6)}...${name.slice(-4)}` : fallback;

    return {
      claimer: {
        name: format(dispute?.claimer, "Claimant"),
        roleLabel: "Claimant",
        avatarUrl: "/images/profiles-mockup/profile-1.jpg",
        themeColor: "blue",
      },
      defender: {
        name: format(dispute?.defender, "Defendant"),
        roleLabel: "Defendant",
        avatarUrl: "/images/profiles-mockup/profile-2.jpg",
        themeColor: "gray",
      },
    };
  }, [dispute]);
}
