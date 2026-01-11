import { useReadContract, useAccount } from "wagmi";
import { SLICE_ABI, SLICE_ADDRESS } from "@/config/contracts";
import { formatUnits } from "viem";
import { useStakingToken } from "./useStakingToken";

export function useJurorStats() {
  const { address } = useAccount();
  const { decimals } = useStakingToken();

  const { data, isLoading, refetch } = useReadContract({
    address: SLICE_ADDRESS,
    abi: SLICE_ABI,
    functionName: "jurorStats", // New mapping on contract
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Default State
  if (!data || !address) {
    return {
      stats: {
        matches: 0,
        wins: 0,
        earnings: "0",
        accuracy: "0%",
      },
      rank: "Rookie",
      isLoading,
      refetch,
    };
  }

  // Parse Data: struct JurorStats { totalDisputes; coherentVotes; totalEarnings; }
  // Viem/Wagmi can return this as an object (named struct) or array depending on ABI config.
  // Handle both cases safely.
  const raw = data as any;

  // Try object property access first (preferred), fallback to array index
  const matches = Number(raw.totalDisputes ?? raw[0] ?? 0);
  const wins = Number(raw.coherentVotes ?? raw[1] ?? 0);
  const rawEarnings = raw.totalEarnings ?? raw[2] ?? 0n;

  // Calculate Accuracy
  const accuracyVal = matches > 0 ? (wins / matches) * 100 : 0;
  const accuracy = accuracyVal.toFixed(0) + "%";

  // Determine Rank
  let rank = "Rookie";
  if (matches > 5) {
    if (accuracyVal >= 90) rank = "High Arbiter";
    else if (accuracyVal >= 70) rank = "Magistrate";
    else if (accuracyVal >= 50) rank = "Juror";
  }

  return {
    stats: {
      matches,
      wins,
      earnings: formatUnits(rawEarnings, decimals),
      accuracy,
    },
    rank,
    isLoading,
    refetch,
  };
}
