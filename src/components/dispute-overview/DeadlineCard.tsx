import React from "react";
import { CalendarIcon } from "./CalendarIcon";
import styles from "./DeadlineCard.module.css";

interface DeadlineCardProps {
  deadline: string;
}

export const DeadlineCard: React.FC<DeadlineCardProps> = ({ deadline }) => {
  return (
    <div className={styles.card}>
      <span className={styles.label}>Fecha límite de resolución:</span>
      <div className={styles.dateContainer}>
        <CalendarIcon size={10} color="#1b1c23" />
        <span className={styles.date}>{deadline}</span>
      </div>
    </div>
  );
};


