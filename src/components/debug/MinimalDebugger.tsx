"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Terminal, Send, Zap } from "lucide-react";
import { useWalletClient, useAccount } from "wagmi";

export const MinimalDebugger = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (msg: string) => setLogs((prev) => [`> ${msg}`, ...prev]);

  // TEST 1: The "Hands Off" Approach
  const sendAuto = async () => {
    await runTest("AUTO_ESTIMATE", {
      to: address,
      value: "0x0",
    });
  };

  // TEST 2: The "Smart Wallet Safe" Approach
  const sendHighGas = async () => {
    await runTest("HIGH_GAS_LIMIT", {
      to: address,
      value: "0x0",
      gas: "0x249F0", // 150,000 Gas
    });
  };

  const runTest = async (testName: string, payload: any) => {
    if (!walletClient) {
      toast.error("Wallet not ready");
      return;
    }

    setIsLoading(true);
    setLogs([]);
    addLog(`🚀 Starting Test: ${testName}`);

    try {
      // 1. Force Chain Switch (Just in case)
      try {
        const chainId = await walletClient.getChainId();
        if (chainId !== 8453) {
          // 0x2105
          addLog("⚠️ Wrong Chain. Switching...");
          await walletClient.switchChain({ id: 8453 });
        }
      } catch (_e) {}

      // 2. Add 'from' address
      const fullPayload = {
        from: address as `0x${string}`,
        ...payload,
      };

      addLog(`📦 Payload: ${JSON.stringify(fullPayload)}`);

      // 3. Send
      const txHash = await walletClient.request({
        method: "eth_sendTransaction",
        params: [fullPayload] as any,
      });

      addLog(`✅ SUCCESS! Hash: ${txHash}`);
      toast.success(`${testName} Passed!`);
    } catch (err: any) {
      console.error(err);
      const msg =
        err.info?.error?.message || err.message || JSON.stringify(err);
      addLog(`❌ FAILED: ${msg}`);

      if (testName === "AUTO_ESTIMATE" && msg.includes("rejected")) {
        addLog(
          "💡 TIP: Try the 'High Gas' button. Smart wallets often fail auto-estimation.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[18px] p-5 shadow-sm border border-gray-100 font-manrope">
      <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-2">
        <div className="bg-[#8c8fff]/10 p-1.5 rounded-lg">
          <Terminal className="w-4 h-4 text-[#8c8fff]" />
        </div>
        <h3 className="font-extrabold text-sm text-[#1b1c23] uppercase">
          Minimal Debugger
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={sendAuto}
          disabled={isLoading}
          className="py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-50 hover:text-[#1b1c23] hover:border-gray-300 transition-all flex flex-col items-center gap-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Send className="w-4 h-4 text-[#8c8fff]" />
          <span>Auto-Estimate</span>
        </button>

        <button
          onClick={sendHighGas}
          disabled={isLoading}
          className="py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-50 hover:text-[#1b1c23] hover:border-gray-300 transition-all flex flex-col items-center gap-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Zap className="w-4 h-4 text-[#8c8fff]" />
          <span>High Gas (150k)</span>
        </button>
      </div>

      <div className="bg-[#1b1c23] rounded-xl p-3 text-[10px] font-mono text-green-400 h-32 overflow-y-auto border border-gray-800 shadow-inner">
        {logs.length === 0 && (
          <span className="text-gray-500 italic">Waiting for input...</span>
        )}
        {logs.map((l, i) => (
          <div
            key={i}
            className="mb-1 break-all border-b border-gray-800/50 pb-1 opacity-90"
          >
            <span className="opacity-50 mr-2">{">"}</span>
            {l.replace(/^> /, "")}
          </div>
        ))}
      </div>
    </div>
  );
};
