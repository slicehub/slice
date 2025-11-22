import React, { useState } from "react";
import { MicrophoneIcon } from "./icons/EvidenceIcons";
import styles from "./AudioEvidenceCard.module.css";

interface AudioEvidence {
  id: string;
  title: string;
  duration: string;
  progress?: number; // 0-100
}

interface AudioEvidenceCardProps {
  audio: AudioEvidence;
}

export const AudioEvidenceCard: React.FC<AudioEvidenceCardProps> = ({ audio }) => {
  const [progress] = useState(audio.progress || 0);

  return (
    <div className={styles.card}>
      <div className={styles.iconContainer}>
        <MicrophoneIcon size={35} color="#1b1c23" />
      </div>
      <div className={styles.content}>
        <div className={styles.title}>{audio.title}</div>
        <div className={styles.progressBarContainer}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            <div className={styles.progressDot} style={{ left: `${progress}%` }} />
          </div>
        </div>
        <div className={styles.duration}>{audio.duration}</div>
      </div>
    </div>
  );
};


