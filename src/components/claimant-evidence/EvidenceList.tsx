import React from "react";
import { EvidenceCard } from "./EvidenceCard";
import { PictureIcon } from "./icons/EvidenceIcons";
import styles from "./EvidenceList.module.css";

interface Evidence {
  id: string;
  type: "image" | "text" | "pdf";
  url: string;
  description: string;
  uploadDate: string;
}

interface EvidenceListProps {
  evidenceList: Evidence[];
}

export const EvidenceList: React.FC<EvidenceListProps> = ({ evidenceList }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.filterBadge}>
          <PictureIcon size={10} color="#1b1c23" />
          Images
        </span>
      </div>
      <div className={styles.scrollContainer}>
        <div className={styles.evidenceGrid}>
          {evidenceList.map((evidence) => (
            <EvidenceCard key={evidence.id} evidence={evidence} />
          ))}
        </div>
      </div>
    </div>
  );
};


