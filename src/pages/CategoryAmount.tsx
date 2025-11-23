import React from "react";
import { useNavigate } from "react-router-dom";
import { CategoryAmountHeader } from "../components/category-amount/CategoryAmountHeader";
import { AmountSelector } from "../components/category-amount/AmountSelector";
import { InfoCard } from "../components/category-amount/InfoCard";
import { SwipeButton } from "../components/category-amount/SwipeButton";
import styles from "./CategoryAmount.module.css";

export const CategoryAmount: React.FC = () => {
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = React.useState<number>(20);

  const handleBack = () => {
    navigate("/disputes");
  };

  const handleSwipeComplete = () => {
    // Navigate to loading screen
    navigate("/loading-disputes");
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
        <SwipeButton onSwipeComplete={handleSwipeComplete} />
      </div>
    </div>
  );
};

export default CategoryAmount;

