import { useState } from "react";
import { useAssignDispute } from "../hooks/useAssignDispute";

export const JoinCourtComponent = () => {
  const { assignDispute, isLoading } = useAssignDispute();
  const [category] = useState("General");

  // Stake amount must be a BigInt (representing stroops/smallest unit)
  // 200 units of the token
  const stakeAmount = BigInt(200);

  const handleJoin = async () => {
    // 1. Call the hook function
    const result = await assignDispute(category, stakeAmount);

    if (result) {
      console.log("Assigned to Dispute ID:", result[0]); // Tuple (u64, Address)
    }
  };

  return (
    <button onClick={handleJoin} disabled={isLoading}>
      {isLoading ? "Staking..." : "Stake & Join Jury"}
    </button>
  );
};
