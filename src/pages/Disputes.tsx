import React from "react";
import { DisputesHeader } from "../components/disputes/DisputesHeader";
import { BalanceCard } from "../components/disputes/BalanceCard";
import { DisputesList } from "../components/disputes/DisputesList";
import styles from "./Disputes.module.css";

export const Disputes: React.FC = () => {
  return (
    <div className={styles.container}>
      <DisputesHeader />
      <BalanceCard />
      <DisputesList />
    </div>
  );
};

export default Disputes;
