"use client";
import { useAccount } from "wagmi";
import { useContracts } from "@/providers/ConnectProvider";
import { defaultChain } from "@/config/chains";

export const NetworkDebugger = () => {
  const { chain } = useAccount();
  const { signer, address, isWrongNetwork } = useContracts();

  if (!address) return null;

  return (
    <div className="fixed bottom-24 right-4 p-4 bg-black/90 text-white text-[10px] font-mono rounded-xl z-[9999] border border-gray-700 shadow-2xl backdrop-blur-md">
      <h3 className="font-bold text-yellow-400 mb-2 flex items-center gap-2">
        🕵️ Network Inspector
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Target:</span>
          <span className="text-green-400 font-bold">
            {defaultChain.name} ({defaultChain.id})
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Actual:</span>
          <span
            className={
              chain?.id === defaultChain.id
                ? "text-green-400 font-bold"
                : "text-red-400 font-bold"
            }
          >
            {chain?.name || "Unknown"} ({chain?.id || "N/A"})
          </span>
        </div>
        <div className="h-px bg-gray-700 my-1" />
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Signer Ready?</span>
          <span
            className={
              signer
                ? "text-green-400 font-bold"
                : "text-red-500 font-bold animate-pulse"
            }
          >
            {signer ? "YES" : "NO (App Halted)"}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Wrong Net Flag:</span>
          <span className={isWrongNetwork ? "text-red-400" : "text-green-400"}>
            {isWrongNetwork ? "TRUE" : "FALSE"}
          </span>
        </div>
      </div>
    </div>
  );
};
