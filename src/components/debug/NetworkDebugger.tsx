"use client";

import { useAccount } from "wagmi";
import { useConnect } from "@/providers/ConnectProvider";
import { useEmbedded } from "@/providers/EmbeddedProvider"; // Import this
import { defaultChain } from "@/config/chains";

export const NetworkDebugger = () => {
  const { chain } = useAccount();
  const { signer, address } = useConnect();
  const { isEmbedded } = useEmbedded(); // Get embedded state

  // Logic: If embedded, we rely on the Default Chain (XO enforces this).
  // If web (Wagmi), we use the detected chain from the wallet.
  const actualChainId = isEmbedded
    ? address
      ? defaultChain.id
      : "N/A" // embedded
    : chain?.id || "N/A"; // web
  const isMatch = actualChainId === defaultChain.id;

  // Note: Visibility is handled by the parent (DebugToggle)
  if (!address) return null;

  return (
    <div className="fixed bottom-18 right-6 p-4 bg-black/90 text-white text-[10px] font-mono rounded-2xl z-[9999] border border-white/10 shadow-2xl backdrop-blur-md w-64 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-indigo-400 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          NETWORK INSPECTOR
        </h3>
      </div>

      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 uppercase tracking-tighter">Mode</span>
          <span className="bg-white/5 px-1.5 py-0.5 rounded text-gray-300">
            {isEmbedded ? "EMBEDDED (XO)" : "WEB (WAGMI)"}
          </span>
        </div>
        <div className="h-[1px] bg-white/5 w-full" />

        <div className="flex justify-between items-center">
          <span className="text-gray-500 uppercase tracking-tighter">
            Target_ID
          </span>
          <span className="bg-white/5 px-1.5 py-0.5 rounded text-indigo-400">
            {defaultChain.id}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 uppercase tracking-tighter">
            Actual_ID
          </span>
          <span
            className={`bg-white/5 px-1.5 py-0.5 rounded ${
              isMatch ? "text-indigo-400" : "text-red-400"
            }`}
          >
            {actualChainId}
          </span>
        </div>
        <div className="h-[1px] bg-white/5 w-full" />
        <div className="flex justify-between items-center">
          <span className="text-gray-500 uppercase tracking-tighter">
            Signer_Status
          </span>
          <span
            className={
              signer ? "text-indigo-400" : "text-red-500 animate-pulse"
            }
          >
            {signer ? "AUTHORIZED" : "HALTED"}
          </span>
        </div>
      </div>
    </div>
  );
};
