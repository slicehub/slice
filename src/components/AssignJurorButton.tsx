import { useAssignDispute } from "@/hooks/useAssignDispute";

export const AssignJurorButton = () => {
  const { findActiveDispute, joinDispute, isLoading, isFinding } =
    useAssignDispute();

  const handleClick = async () => {
    // 1. Find a valid dispute
    const disputeId = await findActiveDispute();

    if (disputeId) {
      // 2. Join it with a default stake (Testnet amount)
      await joinDispute(disputeId, "0.00005");
    }
  };

  const isBusy = isLoading || isFinding;

  return (
    <button
      className="btn btn-primary"
      onClick={() => void handleClick()}
      disabled={isBusy}
    >
      {isBusy ? "Processing..." : "Assign as Juror (Random)"}
    </button>
  );
};
