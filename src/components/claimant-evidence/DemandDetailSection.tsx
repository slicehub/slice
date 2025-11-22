import React from "react";
import styles from "./DemandDetailSection.module.css";

interface DemandDetailSectionProps {
  detail: string;
}

export const DemandDetailSection: React.FC<DemandDetailSectionProps> = ({ detail }) => {
  return (
    <div className={styles.section}>
      <h3 className={styles.title}>Detalle de la demanda</h3>
      <p className={styles.text}>{detail}</p>
    </div>
  );
};


