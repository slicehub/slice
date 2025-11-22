import React from "react";
import type { Dispute } from "./DisputesList";
import {
  CrowdfundingIcon,
  PersonIcon,
  VoteIcon,
} from "./icons/BadgeIcons";
import { ApproveIcon, RejectIcon } from "./icons/Icon";
import { StarIcon } from "./icons/BadgeIcons";
import styles from "./DisputeCard.module.css";

interface DisputeCardProps {
  dispute: Dispute;
}

export const DisputeCard: React.FC<DisputeCardProps> = ({ dispute }) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.iconContainer}>
          {dispute.icon ? (
            <img src={dispute.icon} alt={dispute.title} className={styles.icon} />
          ) : (
            <div className={styles.defaultIcon}>
              {/* Stellar Community Fund usa el SVG descargado */}
              {dispute.id === "1" ? (
                <img
                  src="/images/icons/stellar-fund-icon.svg"
                  alt="Stellar Community Fund"
                  className={styles.icon}
                />
              ) : dispute.id === "2" ? (
                <img
                  src="/images/icons/ethereum-icon.png"
                  alt="Ethereum Foundation"
                  className={styles.icon}
                />
              ) : dispute.id === "3" ? (
                <img
                  src="/images/icons/lionstar-icon.png"
                  alt="Lionstar"
                  className={styles.icon}
                />
              ) : (
                <svg width="55" height="55" viewBox="0 0 55 55" fill="none">
                  <rect width="55" height="55" rx="14" fill="#f5f6f9" />
                  <path
                    d="M27.5 18L37.5 28L27.5 38L17.5 28L27.5 18Z"
                    stroke="#8c8fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          )}
        </div>

        <div className={styles.titleSection}>
          <h3 className={styles.title}>{dispute.title}</h3>
          <div className={styles.badges}>
            <span className={styles.badge}>
              <CrowdfundingIcon size={9} color="#8c8fff" />
              {dispute.category}
            </span>
            <span className={styles.badge}>
              <PersonIcon size={10} color="#8c8fff" />
              {dispute.votesCount}/{dispute.totalVotes} votos
            </span>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.voteSection}>
          <div className={styles.voteLabel}>
            <VoteIcon size={16} color="#1b1c23" />
            Tu voto fue:
          </div>
          <div className={styles.voters}>
            {dispute.voters.map((voter, index) => (
              <div key={index} className={styles.voterCard}>
                <div className={styles.voterAvatar}>
                  {voter.avatar ? (
                    <>
                      <img 
                        src={voter.avatar} 
                        alt={voter.name}
                        onError={(e) => {
                          // Si la imagen no se carga, ocultar img y mostrar placeholder
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = target.parentElement?.querySelector(`.${styles.avatarPlaceholder}`) as HTMLElement;
                          if (placeholder) {
                            placeholder.style.display = 'flex';
                          }
                        }}
                      />
                      <div className={styles.avatarPlaceholder} style={{ display: 'none' }}>
                        {voter.name.charAt(0)}
                      </div>
                    </>
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {voter.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className={styles.voterName}>{voter.name}</div>
                <div className={styles.voteIndicator}>
                  {voter.vote === "approve" ? (
                    <ApproveIcon />
                  ) : (
                    <RejectIcon />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.prize}>
          <StarIcon size={15} className={styles.starIcon} />
          <span>{dispute.prize}</span>
        </div>
        <button className={styles.readButton}>Leer disputa</button>
      </div>
    </div>
  );
};

