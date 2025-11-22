import React from "react";
import { PlayIcon } from "./icons/EvidenceIcons";
import { FullscreenIcon } from "./icons/EvidenceIcons";
import { CalendarIcon } from "../dispute-overview/CalendarIcon";
import styles from "./VideoEvidenceCard.module.css";

interface Evidence {
  id: string;
  type: "video";
  url: string;
  thumbnail?: string;
  description: string;
  uploadDate: string;
}

interface VideoEvidenceCardProps {
  evidence: Evidence;
}

export const VideoEvidenceCard: React.FC<VideoEvidenceCardProps> = ({ evidence }) => {
  const handleFullscreen = () => {
    // TODO: Implementar modal de pantalla completa
    window.open(evidence.url, "_blank");
  };

  return (
    <div className={styles.card}>
      <div className={styles.videoContainer}>
        {evidence.thumbnail ? (
          <img src={evidence.thumbnail} alt={evidence.description} className={styles.thumbnail} />
        ) : (
          <div className={styles.thumbnailPlaceholder} />
        )}
        <div className={styles.playButton}>
          <PlayIcon size={37} color="#1b1c23" />
        </div>
        <button className={styles.fullscreenButton} onClick={handleFullscreen}>
          <FullscreenIcon size={16} color="#1b1c23" />
        </button>
      </div>
      <p className={styles.description}>{evidence.description}</p>
      <div className={styles.dateBadge}>
        <CalendarIcon size={10} color="#31353b" />
        <span>Video tomado el: {evidence.uploadDate}</span>
      </div>
    </div>
  );
};


