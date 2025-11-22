import React from "react";
import styles from "./DisputeOverviewHeader.module.css";

interface DisputeOverviewHeaderProps {
  onBack: () => void;
}

export const DisputeOverviewHeader: React.FC<DisputeOverviewHeaderProps> = ({ onBack }) => {
  return (
    <div className={styles.header}>
      <button className={styles.backButton} onClick={onBack}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 18L9 12L15 6"
            stroke="#1b1c23"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};


