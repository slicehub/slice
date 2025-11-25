import { useCallback, useState, useEffect } from "react";
import { useWallet } from "./useWallet";

import slice from "../contracts/slice";

// Types based on your Rust struct
export interface DisputeData {
  id: bigint;
  claimer: string;
  defender: string;
  status: number; // 0=Created, 1=Commit, 2=Reveal, 3=Finished
  category: string;
  jurors_required: number;
  deadline_pay_seconds: bigint;
  deadline_commit_seconds: bigint;
  deadline_reveal_seconds: bigint;
  assigned_jurors: string[];
  winner?: string;
}

export function useGetDispute(disputeId: string | number) {
  const { address } = useWallet();
  const [dispute, setDispute] = useState<DisputeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDispute = useCallback(async () => {
    if (!disputeId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Even for read-only, setting the source is good practice in Soroban
      if (address) slice.options.publicKey = address;

      // Call the contract
      const { result } = await slice.get_dispute({
        dispute_id: BigInt(disputeId),
      });

      if (result) {
        // The generated binding usually unwraps Result<T, E> automatically
        // if the transaction succeeded locally.
        // We cast it to our interface.
        setDispute(result.unwrap() as unknown as DisputeData);
      }
    } catch (err) {
      console.error(`Error fetching dispute ${disputeId}:`, err);
      setError("Dispute not found or contract error");
      setDispute(null);
    } finally {
      setIsLoading(false);
    }
  }, [disputeId, address]);

  // Auto-fetch on mount or ID change
  useEffect(() => {
    void fetchDispute();
  }, [fetchDispute]);

  return { dispute, isLoading, error, refetch: fetchDispute };
}
