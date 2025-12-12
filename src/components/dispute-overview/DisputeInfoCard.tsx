import React from "react";
import { CrowdfundingIcon, PersonIcon } from "../disputes/icons/BadgeIcons";
import { CalendarIcon } from "./CalendarIcon";
import { CheckCircle2 } from "lucide-react"; // Import Check Icon for Winner
import styles from "./DisputeInfoCard.module.css";

interface Actor {
  name: string;
  role: "Claimer" | "Defender";
  avatar?: string;
  isWinner?: boolean; 
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
  votesCount?: number;
  totalVotes?: number;
  status?: string;
}

interface DisputeInfoCardProps {
  dispute: Dispute;
}

export const DisputeInfoCard: React.FC<DisputeInfoCardProps> = ({
  dispute,
}) => {
  return (
    <div className={styles.card}>
      {/* Header with logo and title */}
      <div className={styles.header}>
        <div className={styles.logoContainer}>
          {dispute.logo ? (
            <img
              src={dispute.logo}
              alt={dispute.title}
              className={styles.logo}
            />
          ) : (
            <div className={styles.logoPlaceholder} />
          )}
        </div>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>{dispute.title}</h2>

          <div className="flex flex-wrap gap-2">
            <span className={styles.badge}>
              <CrowdfundingIcon size={9} color="#1b1c23" />
              {dispute.category}
            </span>

            {/* NEW: Status / Votes Badge */}
            {dispute.status && (
              <span
                className={`${styles.badge} ${dispute.status === "Executed" ? "bg-green-100 text-green-700" : ""}`}
              >
                {dispute.status === "Executed" ? "Resolved" : "Active"}
              </span>
            )}

            {dispute.totalVotes !== undefined && (
              <span className={styles.badge}>
                <PersonIcon size={10} color="#8c8fff" />
                {dispute.votesCount || 0}/{dispute.totalVotes} Votes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actors */}
      <div className={styles.actorsSection}>
        {dispute.actors.map((actor, index) => (
          <div
            key={index}
            className={`${styles.actorCard} ${actor.isWinner ? "bg-green-50 border border-green-200" : ""}`}
            style={{ position: "relative" }}
          >
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
                        `.${styles.avatarPlaceholder}`,
                      ) as HTMLElement;
                      if (placeholder) {
                        placeholder.style.display = "flex";
                      }
                    }}
                  />
                  <div
                    className={styles.avatarPlaceholder}
                    style={{ display: "none" }}
                  >
                    {actor.name.charAt(0)}
                  </div>
                </>
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {actor.name.charAt(0)}
                </div>
              )}
            </div>
            <div className={styles.actorInfo}>
              <div className="flex items-center gap-2">
                <div className={styles.actorName}>{actor.name}</div>
                {/* NEW: Winner Badge */}
                {actor.isWinner && (
                  <span className="bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    WINNER
                  </span>
                )}
              </div>
              <div className={styles.actorRole}>{actor.role}</div>
            </div>
          </div>
        ))}
      </div>

      {/* General Context */}
      <div className={styles.contextSection}>
        <h3 className={styles.contextTitle}>General Context:</h3>
        <p className={styles.contextText}>{dispute.generalContext}</p>
      </div>

      {/* Dates */}
      <div className={styles.datesSection}>
        <div className={styles.dateItem}>
          <div className={styles.dateLabel}>Creation Date</div>
          <div className={styles.dateBadge}>
            <CalendarIcon
              size={10}
              color="#8c8fff"
              className={styles.calendarIcon}
            />
            {dispute.creationDate}
          </div>
        </div>
        <div className={styles.dateItem}>
          <div className={styles.dateLabel}>Max Deadline</div>
          <div className={styles.dateBadge}>
            <CalendarIcon
              size={10}
              color="#8c8fff"
              className={styles.calendarIcon}
            />
            {dispute.deadline}
          </div>
        </div>
      </div>
    </div>
  );
};
