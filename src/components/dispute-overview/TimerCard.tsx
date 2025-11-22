import React from "react";
import { useTimer } from "../../contexts/TimerContext";
import styles from "./TimerCard.module.css";

export const TimerCard: React.FC = () => {
  const { timeInSeconds } = useTimer();

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className={styles.card}>
      <div className={styles.timeContainer}>
        <video
          src="/animations/time.mp4"
          autoPlay
          loop
          muted
          playsInline
          className={styles.timeVideo}
        />
        <span className={styles.time}>{formatTime(timeInSeconds)}min</span>
      </div>
      <span className={styles.label}>Tiempo para votar disponible:</span>
    </div>
  );
};

