import React from "react";
import styles from "./InfoCard.module.css";

export const InfoCard: React.FC = () => {
  return (
    <div className={styles.card}>
      <div className={styles.iconContainer}>
        <div className={styles.iconCircle}>
          <img 
            src="/images/category-amount/alert-icon.svg" 
            alt="Alert" 
            className={styles.alertIcon}
          />
        </div>
      </div>
      <p className={styles.message}>
        Ten en cuenta que una vez comiences la disputa el dinero se liberará y no podrás recuperarlo
      </p>
    </div>
  );
};


