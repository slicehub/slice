"use client";

import React, { useState, useMemo } from "react";
import { useChainId } from "wagmi";
import { useFundWallet } from "@privy-io/react-auth";
import { RefreshCw, AlertCircle } from "lucide-react";

import { DepositIcon, SendIcon, ReceiveIcon } from "./icons/ActionIcons";
import styles from "./BalanceCard.module.css";
import { useXOContracts } from "@/providers/XOContractsProvider";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { SendModal } from "./SendModal";
import { ReceiveModal } from "./ReceiveModal";
import { getContractsForChain } from "@/config/contracts";
import { DEFAULT_CHAIN } from "@/config/chains";
import { useEmbedded } from "@/providers/EmbeddedProvider";

export const BalanceCard: React.FC = () => {
  const { isEmbedded } = useEmbedded();
  const wagmiChainId = useChainId();
  const chainId = isEmbedded ? DEFAULT_CHAIN.chain.id : wagmiChainId;

  const { address } = useXOContracts();
  const { usdcToken } = getContractsForChain(chainId);

  const { formatted, isLoading, error, refetch } = useTokenBalance(usdcToken);
  const { fundWallet } = useFundWallet();

  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);

  const displayBalance = useMemo(() => {
    if (isLoading) return "Loading...";
    if (error) return "Error";
    if (!address) return "---";
    if (formatted === undefined || formatted === null) return "N/A";

    const balance = parseFloat(formatted).toFixed(2);
    return `${balance} USDC`;
  }, [address, isLoading, formatted, error]);

  const handleDeposit = () => {
    if (!address) return;

    fundWallet({
      address,
      options: {
        chain: { id: chainId },
        asset: "USDC",
      },
    });
  };

  return (
    <>
      <div className={styles.card}>
        <div className={styles.leftSection}>
          <div className={styles.balanceSection}>
            <div className={styles.balanceLabel}>Balance</div>

            <div className="flex items-center gap-2">
              <div className={styles.balanceAmount}>{displayBalance}</div>

              {/* Retry Button: Visible on error or stuck N/A state */}
              {(error || (displayBalance === "N/A" && !isLoading)) && (
                <button
                  onClick={() => refetch()}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors group"
                  title="Retry fetch"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-white/70 group-hover:text-white" />
                </button>
              )}
            </div>

            {/* Subtle Error Indicator */}
            {error && (
              <div className="flex items-center gap-1 mt-1 text-[#ff5f5f] text-[10px] font-bold animate-in fade-in">
                <AlertCircle className="w-3 h-3" />
                <span>Failed to load</span>
              </div>
            )}
          </div>
          <button className={styles.billingButton}>Billing Profile</button>
        </div>

        <div className={styles.actionButtons} style={{ gap: "12px" }}>
          <button className={styles.actionButton} onClick={handleDeposit}>
            <DepositIcon className={styles.actionIcon} />
            <span className={styles.actionLabel}>Deposit</span>
          </button>

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

      {isReceiveOpen && (
        <ReceiveModal
          isOpen={isReceiveOpen}
          onClose={() => setIsReceiveOpen(false)}
        />
      )}
    </>
  );
};
