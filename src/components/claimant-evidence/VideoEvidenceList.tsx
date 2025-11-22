import React from "react";
import { VideoEvidenceCard } from "./VideoEvidenceCard";
import { PlayIcon } from "./icons/EvidenceIcons";
import styles from "./EvidenceList.module.css";

interface Evidence {
  id: string;
  type: "video";
  url: string;
  thumbnail?: string;
  description: string;
  uploadDate: string;
}

interface VideoEvidenceListProps {
  evidenceList: Evidence[];
}

export const VideoEvidenceList: React.FC<VideoEvidenceListProps> = ({ evidenceList }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.filterBadge}>
          <PlayIcon size={10} color="#1b1c23" />
          Videos
        </span>
      </div>
      <div className={styles.scrollContainer}>
        <div className={styles.evidenceGrid}>
          {evidenceList.map((evidence) => (
            <VideoEvidenceCard key={evidence.id} evidence={evidence} />
          ))}
        </div>
      </div>
    </div>
  );
};


