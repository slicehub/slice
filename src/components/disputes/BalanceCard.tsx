"use client";

import React, { useState, useMemo } from "react";
import { useChainId, useAccount } from "wagmi";
import { useFundWallet } from "@privy-io/react-auth";
import { RefreshCw, ArrowDownCircle, Send, QrCode } from "lucide-react";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { SendModal } from "./SendModal";
import { ReceiveModal } from "./ReceiveModal";
import { FaucetButton } from "./FaucetButton";

export const BalanceCard: React.FC = () => {
  const chainId = useChainId();
  const { address } = useAccount();

  const { formatted, loading: isLoading, refetch } = useTokenBalance();
  const { fundWallet } = useFundWallet();

  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);

  const displayBalance = useMemo(() => {
    if (isLoading) return "Loading...";
    if (!address) return "---";
    if (formatted === undefined || formatted === null) return "N/A";

    const balance = parseFloat(formatted).toFixed(2);
    return `${balance} USDC`;
  }, [address, isLoading, formatted]);

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

  const actionBtnClass =
    "flex flex-col items-center gap-1 bg-none border-none text-white cursor-pointer p-0 hover:opacity-80 transition-opacity group";
  const iconClass =
    "shrink-0 block w-[40px] h-[40px] group-hover:opacity-80 transition-opacity stroke-1";

  return (
    <>
      {/* Added 'relative' here to position the refresh button */}
      <div className="relative bg-[#1b1c23] rounded-[21px] pt-[26px] px-[28px] pb-6 mt-[50px] mx-5 w-auto min-h-[110px] flex flex-row justify-between items-end text-white box-border">
        {/* Top Right Refresh Button */}
        <button
          onClick={() => refetch()}
          className="absolute top-3 right-4 p-2 text-white/80 hover:text-white transition-colors"
          title="Refresh Balance"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
        </button>

        {/* Left Section */}
        <div className="flex flex-col gap-2.5 items-start flex-1 justify-start">
          <div className="flex flex-col gap-[9px] w-auto mb-0">
            <div className="font-manrope font-semibold text-[13px] leading-none opacity-70 tracking-[-0.26px] text-white">
              Balance
            </div>

            <div className="flex items-center gap-2">
              <div className="font-manrope font-bold text-2xl leading-none tracking-[-0.48px] text-white">
                {displayBalance}
              </div>

              {/* Conditional Retry Button (kept for fallback) */}
              {displayBalance === "N/A" && !isLoading && (
                <button
                  onClick={() => refetch()}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors group"
                  title="Retry fetch"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-white/70 group-hover:text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Action Row: Details + Faucet */}
          <div className="flex items-center gap-2 mt-0">
            <button className="bg-[#8c8fff] text-[#1b1c23] border-none rounded-[12.5px] px-[18px] py-[9px] h-7 flex items-center justify-center font-manrope font-extrabold text-xs tracking-[-0.36px] cursor-pointer hover:opacity-90 whitespace-nowrap shrink-0 transition-opacity">
              Details
            </button>
            <FaucetButton />
          </div>
        </div>

        {/* Action Buttons (Right Side) */}
        <div className="flex gap-[26px] items-center shrink-0 self-end">
          <button className={actionBtnClass} onClick={handleDeposit}>
            <ArrowDownCircle className={iconClass} />
            <span className="font-manrope font-semibold text-xs tracking-[-0.12px] leading-none">
              Deposit
            </span>
          </button>

          <button
            className={actionBtnClass}
            onClick={() => setIsReceiveOpen(true)}
          >
            <QrCode className={iconClass} />
            <span className="font-manrope font-semibold text-xs tracking-[-0.12px] leading-none">
              Receive
            </span>
          </button>

          <button
            className={actionBtnClass}
            onClick={() => setIsSendOpen(true)}
          >
            <Send className={iconClass} />
            <span className="font-manrope font-semibold text-xs tracking-[-0.12px] leading-none">
              Send
            </span>
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
