"use client";

import React, { useState, useMemo } from "react";
import { useChainId } from "wagmi";
import { useFundWallet } from "@privy-io/react-auth";
import { RefreshCw, AlertCircle } from "lucide-react";

import { DepositIcon, SendIcon, ReceiveIcon } from "./icons/ActionIcons";
import { useConnect } from "@/providers/ConnectProvider";
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

  const { address } = useConnect();
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
      <div className="bg-[#1b1c23] rounded-[21px] pt-[26px] px-[28px] pb-6 mt-[50px] mx-5 w-auto min-h-[110px] flex flex-row justify-between items-end text-white box-border">
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

              {/* Retry Button */}
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
          <button className="bg-[#8c8fff] text-[#1b1c23] border-none rounded-[12.5px] px-[18px] py-[9px] h-7 flex items-center justify-center font-manrope font-extrabold text-xs tracking-[-0.36px] cursor-pointer hover:opacity-90 whitespace-nowrap shrink-0 mt-0 transition-opacity">
            Billing Profile
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-[26px] items-center shrink-0 self-end">
          <button
            className="flex flex-col items-center gap-1 bg-none border-none text-white cursor-pointer p-0 hover:opacity-80 transition-opacity group"
            onClick={handleDeposit}
          >
            <DepositIcon className="shrink-0 block w-[40.5px] h-[40.5px] group-hover:opacity-80 transition-opacity" />
            <span className="font-manrope font-semibold text-xs tracking-[-0.12px] leading-none">
              Deposit
            </span>
          </button>

          <button
            className="flex flex-col items-center gap-1 bg-none border-none text-white cursor-pointer p-0 hover:opacity-80 transition-opacity group"
            onClick={() => setIsReceiveOpen(true)}
          >
            <ReceiveIcon className="shrink-0 block w-[40.5px] h-[40.5px] group-hover:opacity-80 transition-opacity" />
            <span className="font-manrope font-semibold text-xs tracking-[-0.12px] leading-none">
              Receive
            </span>
          </button>

          <button
            className="flex flex-col items-center gap-1 bg-none border-none text-white cursor-pointer p-0 hover:opacity-80 transition-opacity group"
            onClick={() => setIsSendOpen(true)}
          >
            <SendIcon className="shrink-0 block w-[40.5px] h-[40.5px] group-hover:opacity-80 transition-opacity" />
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
