"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Zap, CheckCircle2 } from "lucide-react";
import { useWalletClient, useAccount } from "wagmi";

export const SmartDebugger = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (msg: string) => setLogs((prev) => [`> ${msg}`, ...prev]);

  const sendStrictType2 = async () => {
    if (!walletClient) {
      toast.error("Wallet not ready");
      return;
    }

    setIsLoading(true);
    setLogs([]);
    addLog("🚀 Starting Corrected EIP-1559 Test...");

    try {
      // 1. Detect Chain
      const chainId = await walletClient.getChainId();
      addLog(`🔗 Chain: ${chainId}`);

      // 2. Construct Payload
      const payload = {
        from: address as `0x${string}`,
        to: address as `0x${string}`,
        value: "0x0",
        data: "0x",
        type: "0x2", // Must be hex string for eth_sendTransaction usually
        gas: "0x30D40", // 200,000 Gas
        maxPriorityFeePerGas: "0x2FAF080",
        maxFeePerGas: "0x8F0D180",
      };

      addLog(`📦 Payload (Corrected Fees):`);
      addLog(
        JSON.stringify(
          payload,
          (k, v) => (typeof v === "bigint" ? v.toString() : v),
          2,
        ),
      );

      // 3. Send
      addLog("👉 Sending...");
      // Use raw request
      const txHash = await walletClient.request({
        method: "eth_sendTransaction",
        params: [payload] as any, // Type cast for raw params
      });

      addLog(`✅ SUCCESS! Hash: ${txHash}`);
      toast.success("Transaction Sent!");
    } catch (err: any) {
      console.error(err);
      const msg =
        err.info?.error?.message || err.message || JSON.stringify(err);
      addLog(`❌ FAILED: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[18px] p-5 shadow-sm border border-gray-100 font-manrope">
      <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-2">
        <div className="bg-emerald-50 p-1.5 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>
        <h3 className="font-extrabold text-sm text-[#1b1c23] uppercase">
          Final Validator
        </h3>
      </div>

      <div className="mb-4">
        <button
          onClick={sendStrictType2}
          disabled={isLoading || !address}
          className="w-full py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-xs hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all flex justify-center items-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Zap className="w-4 h-4 text-emerald-500" />
          <span>Send Valid Type-2 Tx</span>
        </button>
      </div>

      <div className="bg-[#1b1c23] rounded-xl p-3 text-[10px] font-mono text-green-400 h-64 overflow-y-auto border border-gray-800 shadow-inner">
        {logs.length === 0 && (
          <span className="text-gray-500 italic">Ready...</span>
        )}
        {logs.map((l, i) => (
          <div
            key={i}
            className="mb-1 break-all border-b border-gray-800/50 pb-1 whitespace-pre-wrap opacity-90"
          >
            <span className="opacity-50 mr-2">{">"}</span>
            {l.replace(/^> /, "")}
          </div>
        ))}
      </div>
    </div>
  );
};
