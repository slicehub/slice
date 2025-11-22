import React from "react";
import { FullscreenIcon } from "./icons/EvidenceIcons";
import { CalendarIcon } from "../dispute-overview/CalendarIcon";
import styles from "./EvidenceCard.module.css";

interface Evidence {
  id: string;
  type: "image" | "text" | "pdf";
  url: string;
  description: string;
  uploadDate: string;
}

interface EvidenceCardProps {
  evidence: Evidence;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence }) => {
  const handleFullscreen = () => {
    // TODO: Implementar modal de pantalla completa
    window.open(evidence.url, "_blank");
  };

  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <img src={evidence.url} alt={evidence.description} className={styles.image} />
        <button className={styles.fullscreenButton} onClick={handleFullscreen}>
          <FullscreenIcon size={16} color="#1b1c23" />
        </button>
      </div>
      <p className={styles.description}>{evidence.description}</p>
      <div className={styles.dateBadge}>
        <CalendarIcon size={10} color="#31353b" />
        <span>Foto tomada el: {evidence.uploadDate}</span>
      </div>
    </div>
  );
};

