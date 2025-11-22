import React from "react";
import styles from "./AmountSelector.module.css";

interface AmountSelectorProps {
  selectedAmount: number;
  onAmountChange: (amount: number) => void;
}

const AMOUNTS = [1, 5, 10, 15, 20, 25, 50, 75, 100];

export const AmountSelector: React.FC<AmountSelectorProps> = ({
  selectedAmount,
  onAmountChange,
}) => {
  const getSliderPosition = () => {
    const index = AMOUNTS.indexOf(selectedAmount);
    if (index === -1) return 0;
    return (index / (AMOUNTS.length - 1)) * 100;
  };

  const handleAmountClick = (amount: number) => {
    onAmountChange(amount);
  };

  const position = getSliderPosition();

  return (
    <div className={styles.container}>
      <div 
        className={styles.selectedLabel}
        style={{ 
          left: `${position}%`,
          transform: "translateX(-50%)"
        }}
      >
        <span>{selectedAmount} USD</span>
      </div>
      
      <div className={styles.sliderContainer}>
        <div className={styles.sliderTrack}>
          <div 
            className={styles.sliderFill}
            style={{ width: `${position}%` }}
          />
        </div>
        <input
          type="range"
          min="0"
          max={AMOUNTS.length - 1}
          value={AMOUNTS.indexOf(selectedAmount)}
          onChange={(e) => {
            const index = parseInt(e.target.value);
            onAmountChange(AMOUNTS[index]);
          }}
          className={styles.sliderInput}
        />
        <div 
          className={styles.sliderHandle}
          style={{ left: `calc(${position}% - 7px)` }}
        />
      </div>
      
      <div className={styles.amountLabels}>
        {AMOUNTS.map((amount) => (
          <button
            key={amount}
            className={`${styles.amountLabel} ${
              amount === selectedAmount ? styles.selected : ""
            }`}
            onClick={() => handleAmountClick(amount)}
            style={{
              left: `${(AMOUNTS.indexOf(amount) / (AMOUNTS.length - 1)) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            ${amount}
          </button>
        ))}
      </div>
    </div>
  );
};

