import React from "react";
import { useWalletBalance } from "../../hooks/useWalletBalance";
import { DepositIcon, SendIcon } from "./icons/ActionIcons";
import styles from "./BalanceCard.module.css";

export const BalanceCard: React.FC = () => {
  const { balance } = useWalletBalance();

  // Convertir balance a USD (simplificado - en producción usarías una API de conversión)
  const balanceUSD = balance ? (parseFloat(balance) * 0.12).toFixed(0) : "0";

  return (
    <div className={styles.card}>
      <div className={styles.leftSection}>
        <div className={styles.balanceSection}>
          <div className={styles.balanceLabel}>Balance</div>
          <div className={styles.balanceAmount}>{balanceUSD} USD</div>
        </div>
        <button className={styles.billingButton}>Billing Profile</button>
      </div>

      <div className={styles.actionButtons}>
        <button className={styles.actionButton}>
          <DepositIcon className={styles.actionIcon} />
          <span className={styles.actionLabel}>Deposit</span>
        </button>

        <button className={styles.actionButton}>
          <SendIcon className={styles.actionIcon} />
          <span className={styles.actionLabel}>Send</span>
        </button>
      </div>
    </div>
  );
};

