import { useReadContract } from "wagmi";
import { SLICE_ABI, SLICE_ADDRESS } from "@/config/contracts";
import { transformDisputeData, type DisputeUI } from "@/util/disputeAdapter";
import { useState, useEffect } from "react";

export function useGetDispute(id: string) {
  // 1. Fetch raw dispute data from the contract
  const {
    data: rawDispute,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: SLICE_ADDRESS,
    abi: SLICE_ABI,
    functionName: "disputes", // Matches your Solidity mapping
    args: [BigInt(id)],
    query: {
      enabled: !!id, // Only run if ID exists
      staleTime: 5000, // Cache for 5 seconds
    },
  });

  const [transformedDispute, setTransformedDispute] =
    useState<DisputeUI | null>(null);

  // 2. Transform the data using your utility
  // Since transformDisputeData is async (fetches IPFS), we need a useEffect
  useEffect(() => {
    async function load() {
      if (!rawDispute) {
        setTransformedDispute(null);
        return;
      }
      try {
        // We pass the raw result to the transformer we fixed in Step 1
        const transformed = await transformDisputeData({
          ...(rawDispute as any),
          id,
        });
        setTransformedDispute(transformed);
      } catch (e) {
        console.error("Failed to transform dispute data", e);
      }
    }
    load();
  }, [rawDispute, id]);

  return {
    dispute: transformedDispute,
    loading: isLoading,
    error,
    refetch,
  };
}
