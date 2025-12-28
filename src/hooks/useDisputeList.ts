import { useReadContract, useReadContracts } from "wagmi";
import { SLICE_ABI, SLICE_ADDRESS } from "@/config/contracts";
import { transformDisputeData, type DisputeUI } from "@/util/disputeAdapter";
import { useMemo, useState, useEffect } from "react";
import { useAccount } from "wagmi";

// "juror" = disputes where I am a juror
// "all" = all disputes (for the main list)
type ListType = "juror" | "all";

export type Dispute = DisputeUI;

const { address } = useAccount();
export function useDisputeList(listType: ListType) {
  // 1. Get the total number of disputes OR juror disputes depending on type
  // Note: For "juror" type, we need a separate read or logic.
  // Assuming 'getJurorDisputes' exists on contract for now, or we filter locally.
  // Based on previous code: ids = await contract.getJurorDisputes(address);

  const { data: jurorDisputeIds } = useReadContract({
    address: SLICE_ADDRESS,
    abi: SLICE_ABI,
    functionName: "getJurorDisputes",
    args: address ? [address] : undefined,
    query: {
      enabled: listType === "juror" && !!address,
    },
  });

  const { data: totalCount } = useReadContract({
    address: SLICE_ADDRESS,
    abi: SLICE_ABI,
    functionName: "disputeCount",
    query: {
      enabled: listType === "all",
    },
  });

  // 2. Prepare the Multicall Array
  const calls = useMemo(() => {
    const contracts = [];

    if (listType === "juror" && jurorDisputeIds) {
      const ids = Array.from(jurorDisputeIds as bigint[]);
      for (const id of ids) {
        contracts.push({
          address: SLICE_ADDRESS,
          abi: SLICE_ABI,
          functionName: "disputes",
          args: [id],
        });
      }
    } else if (listType === "all" && totalCount) {
      const total = Number(totalCount);
      // Loop backwards to show newest first, limit to 20
      const start = total; // disputeCount is length, so last index is total - 1? usually count is next ID.
      // If count is 1, ID is 0.
      // Let's assume count is Next ID.
      const end = Math.max(0, start - 20);

      for (let i = start - 1; i >= end; i--) {
        contracts.push({
          address: SLICE_ADDRESS,
          abi: SLICE_ABI,
          functionName: "disputes",
          args: [BigInt(i)],
        });
      }
    }
    return contracts;
  }, [listType, jurorDisputeIds, totalCount]);

  // 3. Fetch ALL disputes in one single RPC call
  const {
    data: results,
    isLoading: isMulticallLoading,
    refetch,
  } = useReadContracts({
    contracts: calls,
    query: {
      enabled: calls.length > 0,
    },
  });

  const [disputes, setDisputes] = useState<DisputeUI[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);

  // 4. Transform Results (handling async IPFS)
  useEffect(() => {
    async function process() {
      if (!results || results.length === 0) {
        setDisputes([]);
        setIsProcessing(false);
        return;
      }

      setIsProcessing(true);
      const processed = await Promise.all(
        results.map(async (result) => {
          if (result.status !== "success") return null;

          // We need to know the ID for this result.
          // For 'all', it matches the reverse loop order.
          // For 'juror', it matches the jurorDisputeIds order.
          // However, the Struct likely contains the ID (based on adapter code: contractData.id)
          // If the struct has the ID, we are good.

          return await transformDisputeData(result.result);
        }),
      );

      setDisputes(processed.filter((d): d is DisputeUI => d !== null));
      setIsProcessing(false);
    }

    process();
  }, [results]);

  return {
    disputes,
    isLoading: isMulticallLoading || isProcessing,
    refetch,
  };
}
