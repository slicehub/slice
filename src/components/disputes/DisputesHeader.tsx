import React from "react";
import styles from "./DisputesHeader.module.css";
import ConnectButton from "../ConnectButton";

export const DisputesHeader: React.FC = () => {
  return (
    <div className={styles.header}>
      <img
        src="/images/icons/header-top.svg"
        alt="Header"
        className={styles.headerImage}
      />

      <div className="flex items-center gap-3">
        <ConnectButton />
      </div>
    </div>
  );
};
