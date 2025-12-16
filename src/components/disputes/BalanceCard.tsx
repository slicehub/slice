"use client";

import React, { useState } from "react";
import { DepositIcon, SendIcon, ReceiveIcon } from "./icons/ActionIcons";
import styles from "./BalanceCard.module.css";
import { useXOContracts } from "@/providers/XOContractsProvider";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useAppKit } from "@reown/appkit/react";
import { SendModal } from "./SendModal";
import { ReceiveModal } from "./ReceiveModal";
import { useChainId } from "wagmi";
import { getContractsForChain } from "@/config/contracts";

export const BalanceCard: React.FC = () => {
  const chainId = useChainId();
  const { address } = useXOContracts();
  const { usdcToken } = getContractsForChain(chainId);
  const { formatted, isLoading } = useTokenBalance(usdcToken);
  const { open } = useAppKit();

  const [isSendOpen, setIsSendOpen] = useState(false);
  // 3. Add Receive State
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);

  const displayBalance = React.useMemo(() => {
    if (!address) return "---";
    if (isLoading) return "Loading...";
    if (formatted === undefined || formatted === null) return "N/A";
    const balance = parseFloat(formatted).toFixed(2);
    return `${balance} USDC`;
  }, [address, isLoading, formatted]);

  const handleDeposit = () => {
    open({ view: "OnRampProviders" });
  };

  return (
    <>
      <div className={styles.card}>
        <div className={styles.leftSection}>
          <div className={styles.balanceSection}>
            <div className={styles.balanceLabel}>Balance</div>
            <div className={styles.balanceAmount}>{displayBalance}</div>
          </div>
          <button className={styles.billingButton}>Billing Profile</button>
        </div>

        {/* 4. Update Action Buttons Container */}
        <div className={styles.actionButtons} style={{ gap: "12px" }}>
          <button className={styles.actionButton} onClick={handleDeposit}>
            <DepositIcon className={styles.actionIcon} />
            <span className={styles.actionLabel}>Deposit</span>
          </button>

          {/* New Receive Button */}
          <button
            className={styles.actionButton}
            onClick={() => setIsReceiveOpen(true)}
          >
            <ReceiveIcon className={styles.actionIcon} />
            <span className={styles.actionLabel}>Receive</span>
          </button>

          <button
            className={styles.actionButton}
            onClick={() => setIsSendOpen(true)}
          >
            <SendIcon className={styles.actionIcon} />
            <span className={styles.actionLabel}>Send</span>
          </button>
        </div>
      </div>

      {isSendOpen && (
        <SendModal isOpen={isSendOpen} onClose={() => setIsSendOpen(false)} />
      )}

      {/* 5. Render Receive Modal */}
      {isReceiveOpen && (
        <ReceiveModal
          isOpen={isReceiveOpen}
          onClose={() => setIsReceiveOpen(false)}
        />
      )}
    </>
  );
};
