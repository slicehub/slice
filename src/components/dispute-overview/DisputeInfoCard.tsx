import React from "react";
import { CrowdfundingIcon } from "../disputes/icons/BadgeIcons";
import { CalendarIcon } from "./CalendarIcon";
import styles from "./DisputeInfoCard.module.css";

interface Actor {
  name: string;
  role: "Claimer" | "Defender";
  avatar?: string;
}

interface Dispute {
  id: string;
  title: string;
  logo?: string;
  category: string;
  actors: Actor[];
  generalContext: string;
  creationDate: string;
  deadline: string;
}

interface DisputeInfoCardProps {
  dispute: Dispute;
}

export const DisputeInfoCard: React.FC<DisputeInfoCardProps> = ({ dispute }) => {
  return (
    <div className={styles.card}>
      {/* Header with logo and title */}
      <div className={styles.header}>
        <div className={styles.logoContainer}>
          {dispute.logo ? (
            <img src={dispute.logo} alt={dispute.title} className={styles.logo} />
          ) : (
            <div className={styles.logoPlaceholder} />
          )}
        </div>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>{dispute.title}</h2>
          <span className={styles.badge}>
            <CrowdfundingIcon size={9} color="#1b1c23" />
            {dispute.category}
          </span>
        </div>
      </div>

      {/* Actors */}
      <div className={styles.actorsSection}>
        {dispute.actors.map((actor, index) => (
          <div key={index} className={styles.actorCard}>
            <div className={styles.actorAvatar}>
              {actor.avatar ? (
                <>
                  <img
                    src={actor.avatar}
                    alt={actor.name}
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
                    {actor.name.charAt(0)}
                  </div>
                </>
              ) : (
                <div className={styles.avatarPlaceholder}>{actor.name.charAt(0)}</div>
              )}
            </div>
            <div className={styles.actorInfo}>
              <div className={styles.actorName}>{actor.name}</div>
              <div className={styles.actorRole}>{actor.role}</div>
            </div>
          </div>
        ))}
      </div>

      {/* General Context */}
      <div className={styles.contextSection}>
        <h3 className={styles.contextTitle}>Contexto General:</h3>
        <p className={styles.contextText}>{dispute.generalContext}</p>
      </div>

      {/* Dates */}
      <div className={styles.datesSection}>
        <div className={styles.dateItem}>
          <div className={styles.dateLabel}>Fecha de creación</div>
          <div className={styles.dateBadge}>
            <CalendarIcon size={10} color="#8c8fff" className={styles.calendarIcon} />
            {dispute.creationDate}
          </div>
        </div>
        <div className={styles.dateItem}>
          <div className={styles.dateLabel}>Deadline máximo</div>
          <div className={styles.dateBadge}>
            <CalendarIcon size={10} color="#8c8fff" className={styles.calendarIcon} />
            {dispute.deadline}
          </div>
        </div>
      </div>
    </div>
  );
};

