import { useAssignDispute } from "../hooks/useAssignDispute";

export const JoinCourtComponent = () => {
  const { findActiveDispute, joinDispute, isLoading, isFinding } =
    useAssignDispute();

  const handleJoin = async () => {
    // 1. Find
    const disputeId = await findActiveDispute();

    if (disputeId) {
      // 2. Join
      const result = await joinDispute(disputeId, "0.00005");
      if (result) {
        console.log("Assigned to Dispute ID:", disputeId);
      }
    }
  };

  const isBusy = isLoading || isFinding;

  return (
    <button onClick={handleJoin} disabled={isBusy}>
      {isBusy ? "Staking..." : "Stake & Join Jury"}
    </button>
  );
};
