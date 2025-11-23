import React from "react";
import { AudioEvidenceCard } from "./AudioEvidenceCard";
import { MicrophoneIcon } from "./icons/EvidenceIcons";
import styles from "./EvidenceList.module.css";

interface AudioEvidence {
  id: string;
  title: string;
  duration: string;
  progress?: number;
}

interface AudioEvidenceListProps {
  audio: AudioEvidence;
}

export const AudioEvidenceList: React.FC<AudioEvidenceListProps> = ({ audio }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.filterBadge}>
          <MicrophoneIcon size={10} color="#1b1c23" />
          Audio
        </span>
      </div>
      <AudioEvidenceCard audio={audio} />
    </div>
  );
};

