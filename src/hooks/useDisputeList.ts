import { useState, useEffect } from "react";
import { useSliceContract } from "@/hooks/useSliceContract";
import { useConnect } from "@/providers/ConnectProvider";
import { transformDisputeData, DisputeUI } from "@/util/disputeAdapter";

// "juror" = disputes where I am a juror
// "all" = all disputes (for the main list)
type ListType = "juror" | "all";

export type Dispute = DisputeUI;

export function useDisputeList(listType: ListType) {
  const { address } = useConnect();
  const contract = useSliceContract();
  const [disputes, setDisputes] = useState<DisputeUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchList = async () => {
      if (!contract || !contract.target) {
        setIsLoading(false);
        return;
      }

      // If we need user address (for juror view) but don't have it, wait.
      if (listType === "juror" && !address) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        let ids: bigint[] = [];

        // 1. Determine which IDs to fetch
        if (listType === "juror" && address) {
          // Fetch assignments for this specific user
          ids = await contract.getJurorDisputes(address);
        } else {
          // Fetch global list (e.g., last 20 disputes)
          const count = await contract.disputeCount();
          const start = Number(count);
          const end = Math.max(1, start - 20); // Limit to latest 20
          for (let i = start; i >= end; i--) {
            ids.push(BigInt(i));
          }
        }

        // 2. Fetch details for each ID
        const loaded = await Promise.all(
          ids.map(async (idBg: bigint) => {
            const id = idBg.toString();
            // Using the adapter
            const d = await contract.disputes(id);
            return await transformDisputeData(d);
          }),
        );

        // Filter out nulls if any, and set state
        setDisputes(loaded);
      } catch (e) {
        console.error("Error in useDisputeList:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchList();
  }, [contract, address, listType]);

  return { disputes, isLoading };
}
