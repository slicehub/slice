import React from "react";
import { useNavigate } from "react-router-dom";
import { CategoryAmountHeader } from "../components/category-amount/CategoryAmountHeader";
import { AmountSelector } from "../components/category-amount/AmountSelector";
import { InfoCard } from "../components/category-amount/InfoCard";
import { SwipeButton } from "../components/category-amount/SwipeButton";
import { useAssignDispute } from "../hooks/useAssignDispute";
import { Text } from "@stellar/design-system"; // Using Text for loading state
import styles from "./CategoryAmount.module.css";

export const CategoryAmount: React.FC = () => {
  const navigate = useNavigate();
  // Initialize with a default stake amount (e.g., 20 USD/Tokens)
  const [selectedAmount, setSelectedAmount] = React.useState<number>(20);

  // Hook to interact with the Slice contract's assign_dispute function
  const { assignDispute, isLoading } = useAssignDispute();

  const handleBack = () => {
    navigate("/disputes");
  };

  const handleSwipeComplete = async () => {
    // 1. Define the category (hardcoded for MVP, or dynamic based on previous selection)
    const category = "General";

    // 2. Trigger the smart contract interaction
    // We convert the selected amount to BigInt as required by the contract
    const result = await assignDispute(category, BigInt(selectedAmount));

    // 3. Only navigate if the transaction was successful
    if (result) {
      navigate("/loading-disputes");
    }
  };

  return (
    <div className={styles.container}>
      <CategoryAmountHeader onBack={handleBack} />

      <div className={styles.mainCard}>
        <div className={styles.handIcon}>
          <video
            src="/animations/money.mp4"
            autoPlay
            loop
            muted
            playsInline
            className={styles.handVideo}
          />
        </div>

        <h1 className={styles.title}>Select amount of money</h1>

        <p className={styles.subtitle}>
          You'll play with users with a monetary range selection like yours
        </p>

        <AmountSelector
          selectedAmount={selectedAmount}
          onAmountChange={setSelectedAmount}
        />
      </div>

      <InfoCard />

      <div className={styles.swipeButtonContainer}>
        {/* Conditional rendering: Show loading state while transaction is processing */}
        {isLoading ? (
          <div
            style={{
              padding: "12px",
              background: "#1b1c23",
              borderRadius: "14px",
              color: "white",
              textAlign: "center",
              width: "241px",
            }}
          >
            <Text as="span" size="md" weight="bold">
              Confirming Stake on Chain...
            </Text>
          </div>
        ) : (
          <SwipeButton onSwipeComplete={() => void handleSwipeComplete()} />
        )}
      </div>
    </div>
  );
};

export default CategoryAmount;
