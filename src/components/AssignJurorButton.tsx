import { Button } from "@stellar/design-system";
import { useAssignDispute } from "../hooks/useAssignDispute";

export const AssignJurorButton = () => {
  const { assignDispute, isLoading } = useAssignDispute();

  const handleClick = async () => {
    const category = "General";
    const stakeAmount = BigInt(200); // 200 units of the token

    await assignDispute(category, stakeAmount);
  };

  return (
    <Button
      onClick={() => void handleClick()}
      disabled={isLoading}
      variant="primary"
      size="md"
      isLoading={isLoading}
    >
      {isLoading ? "Assigning..." : "Assign as Juror"}
    </Button>
  );
};
