import React from "react";
import { PersonIcon } from "../disputes/icons/BadgeIcons";
import styles from "./ClaimantInfoCard.module.css";

interface Claimant {
  name: string;
  role: string;
  avatar?: string;
}

interface ClaimantInfoCardProps {
  claimant: Claimant;
}

export const ClaimantInfoCard: React.FC<ClaimantInfoCardProps> = ({ claimant }) => {
  return (
    <div className={styles.card}>
      <div className={styles.avatarContainer}>
        {claimant.avatar ? (
          <>
            <img
              src={claimant.avatar}
              alt={claimant.name}
              className={styles.avatar}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const placeholder = target.parentElement?.querySelector(
                  `.${styles.avatarPlaceholder}`
                ) as HTMLElement;
                if (placeholder) {
                  placeholder.style.display = "flex";
                }
              }}
            />
            <div className={styles.avatarPlaceholder} style={{ display: "none" }}>
              {claimant.name.charAt(0)}
            </div>
          </>
        ) : (
          <div className={styles.avatarPlaceholder}>{claimant.name.charAt(0)}</div>
        )}
      </div>
      <div className={styles.infoSection}>
        <h2 className={styles.title}>Evidence from {claimant.name}</h2>
        <span className={styles.badge}>
          <PersonIcon size={10} color="#8c8fff" />
          {claimant.role}
        </span>
      </div>
    </div>
  );
};


