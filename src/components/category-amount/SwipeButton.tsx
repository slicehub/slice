import React, { useRef } from "react";
import styles from "./SwipeButton.module.css";
import { useSliderDrag } from "@/hooks/useSliderDrag";

interface SwipeButtonProps {
  onSwipeComplete: () => void;
  children?: React.ReactNode;
}

export const SwipeButton: React.FC<SwipeButtonProps> = ({
  onSwipeComplete,
  children,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { progress, startDrag } = useSliderDrag(buttonRef, onSwipeComplete);

  return (
    <button
      ref={buttonRef}
      className={styles.swipeButton}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
    >
      <div className={styles.buttonBackground} />
      <div className={styles.buttonBorder} />

      <div
        className={styles.progressBar}
        style={{ width: `calc(${progress}% + 18px)` }}
      />

      <div className={styles.swipeHandle} style={{ left: `${progress}%` }}>
        <div className={styles.handleGradient} />
        <img
          src="/images/category-amount/subtract-icon.svg"
          alt="Arrow"
          className={styles.arrowIcon}
        />
      </div>

      <span className={styles.buttonText}>
        {children || "Swipe to confirm"}
      </span>
    </button>
  );
};
