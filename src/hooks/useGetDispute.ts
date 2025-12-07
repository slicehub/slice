import { useCallback, useState, useEffect } from "react";

import { useSliceContract } from "./useSliceContract";

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
  const contract = useSliceContract(); // Get the Ethers contract
  const [dispute, setDispute] = useState<DisputeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDispute = useCallback(async () => {
    if (!contract || !disputeId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Even for read-only, setting the source is good practice in Soroban
      const d = await contract.disputes(disputeId);

      setDispute({
        id: d.id, // Already a BigInt from Ethers v6
        claimer: d.claimer,
        defender: d.defender,
        status: Number(d.status), // Contract returns BigInt for enums, convert to Number
        category: d.category,
        jurors_required: Number(d.jurorsRequired), // Contract returns BigInt
        deadline_pay_seconds: d.payDeadline, // Stores the timestamp (BigInt)
        deadline_commit_seconds: d.commitDeadline,
        deadline_reveal_seconds: d.revealDeadline,
        assigned_jurors: [], // The default 'disputes' getter does not return the array of jurors
        winner: d.winner,
      });
    } catch (err) {
      console.error(`Error fetching dispute ${disputeId}:`, err);
      setError("Dispute not found or contract error");
      setDispute(null);
    } finally {
      setIsLoading(false);
    }
  }, [disputeId]);

  // Auto-fetch on mount or ID change
  useEffect(() => {
    void fetchDispute();
  }, [fetchDispute]);

  return { dispute, isLoading, error, refetch: fetchDispute };
}
