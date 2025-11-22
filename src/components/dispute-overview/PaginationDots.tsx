import React from "react";
import styles from "./PaginationDots.module.css";

interface PaginationDotsProps {
  currentIndex: number;
  total: number;
}

export const PaginationDots: React.FC<PaginationDotsProps> = ({ currentIndex, total }) => {
  return (
    <div className={styles.container}>
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={`${styles.dot} ${index === currentIndex ? styles.active : ""}`}
        />
      ))}
    </div>
  );
};


