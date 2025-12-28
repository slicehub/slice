"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Terminal, Play } from "lucide-react";
import { useWalletClient, useAccount } from "wagmi";

export const BaseRawDebugger = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (msg: string) => setLogs((prev) => [`> ${msg}`, ...prev]);

  const handleSafeRawSend = async () => {
    if (!address || !walletClient) {
      toast.error("Wallet not ready");
      return;
    }

    setIsLoading(true);
    setLogs([]);
    addLog("🚀 Starting Safe Raw Transaction...");

    try {
      // 1. Force Chain Switch
      try {
        const chainId = await walletClient.getChainId();
        addLog(`Current Chain ID: ${chainId}`);

        if (chainId !== 8453) {
          addLog("⚠️ Switching to Base Mainnet (8453)...");
          await walletClient.switchChain({ id: 8453 }); // 0x2105 technically default wagmi logic
          addLog("✅ Switch request sent");
        }
      } catch (switchErr: any) {
        addLog(`⚠️ Chain Check Warning: ${switchErr.message || switchErr}`);
      }

      // 2. Construct Raw EIP-1559 Payload (Type 2)
      const rawPayload = {
        from: address as `0x${string}`,
        to: address as `0x${string}`, // Send to self
        value: "0x0",
        data: "0x",
        chainId: "0x2105", // Base Mainnet (Hex)
        type: "0x2", // ❗ FORCE EIP-1559
        gas: "0x5208", // 21,000 Gas Limit
        maxFeePerGas: "0x5F5E100", // 0.1 Gwei
        maxPriorityFeePerGas: "0x2FAF080", // 0.05 Gwei
      };

      addLog("📦 Payload constructed:");
      addLog(JSON.stringify(rawPayload, null, 2));

      // 3. Send using client.request
      addLog("👉 Sending via walletClient.request('eth_sendTransaction')...");

      const txHash = await walletClient.request({
        method: "eth_sendTransaction",
        params: [rawPayload] as any,
      });

      addLog(`✅ SUCCESS! Hash: ${txHash}`);
      toast.success("Raw Transaction Sent!");
    } catch (err: any) {
      console.error(err);

      const msg =
        err.info?.error?.message ||
        err.shortMessage ||
        err.message ||
        JSON.stringify(err);

      addLog(`❌ ERROR: ${msg}`);

      if (msg.includes("User rejected") || msg.includes("rejected")) {
        addLog(
          "💡 ANALYSIS: The payload reached the wallet, but was rejected.",
        );
        addLog(
          "   1. Check if you have ETH for gas (even 0 ETH transfers cost gas).",
        );
        addLog(
          "   2. The embedded wallet might not support manual nonce/gas fields.",
        );
      } else {
        addLog("💡 ANALYSIS: The connection to the RPC provider failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[18px] p-5 shadow-sm border border-gray-100 flex flex-col gap-4 font-manrope">
      <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
        <div className="bg-[#8c8fff]/10 p-1.5 rounded-lg">
          <Terminal className="w-4 h-4 text-[#8c8fff]" />
        </div>
        <h3 className="font-extrabold text-sm text-[#1b1c23] uppercase">
          Safe Base Debugger
        </h3>
      </div>

      <div className="mb-1 text-gray-500 space-y-1 text-xs font-medium">
        <div className="flex justify-between">
          <span>Target:</span>
          <span className="text-[#1b1c23] font-bold">Base Mainnet (8453)</span>
        </div>
        <div className="flex justify-between">
          <span>Method:</span>
          <span className="text-[#8c8fff] font-bold">client.request()</span>
        </div>
      </div>

      <button
        onClick={handleSafeRawSend}
        disabled={isLoading || !address}
        className="w-full py-3 bg-[#1b1c23] text-white rounded-xl font-bold text-xs hover:bg-[#2c2d33] active:scale-[0.98] transition-all flex justify-center gap-2 uppercase mb-1 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-gray-200"
      >
        {isLoading ? (
          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Play className="w-3 h-3 mt-0.5" /> Send Type-2 Tx
          </>
        )}
      </button>

      <div className="bg-[#1b1c23] rounded-xl p-3 text-[10px] font-mono text-green-400 h-48 overflow-y-auto space-y-1 border border-gray-800 shadow-inner">
        {logs.length === 0 && (
          <span className="text-gray-500 italic">Ready to debug...</span>
        )}
        {logs.map((l, i) => (
          <div
            key={i}
            className="mb-1 break-all border-b border-gray-800/50 pb-1 whitespace-pre-wrap opacity-90"
          >
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};
