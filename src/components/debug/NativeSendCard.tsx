import React, { useState } from "react";
import { parseEther } from "viem";
import { toast } from "sonner";
import { useSendTransaction, useAccount } from "wagmi";
import { Send, Loader2, AlertTriangle } from "lucide-react";

export const NativeSendCard = () => {
  const { address } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) =>
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} > ${msg}`]);

  // Helper to safely stringify objects with BigInt
  const safeStringify = (obj: any) => {
    return JSON.stringify(obj, (key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    );
  };

  const handleNativeSend = async () => {
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }

    setStatus("loading");
    setLogs([]);
    addLog("Starting Native ETH Transfer...");

    try {
      // 2. Construct Transaction
      const value = parseEther("0.000001");

      const txPayload = {
        to: address as `0x${string}`, // Send to self
        value: value,
      };

      // Use safeStringify
      addLog(`Payload: ${safeStringify(txPayload)}`);

      // 3. Send
      addLog("Requesting Signature...");
      const hash = await sendTransactionAsync({
        to: address as `0x${string}`,
        value: value,
      });

      addLog(`Tx Sent! Hash: ${hash}`);
      toast.success("Native Transaction Sent!");
      setStatus("success");

      // Note: We are not waiting for confirmation here to keep it simple/raw,
      // or we could use usePublicClient().waitForTransactionReceipt(hash) if we wanted.
      // Ethers code waited. Let's just log "Sent" as 'native send' usually implies fire-and-forget or just testing connectivity.
      // If we want to wait, we'd need publicClient.
      // I'll leave it as sent to match "Raw" feel, or just say "Sent".
    } catch (err: any) {
      console.error("Native Send Error", err);
      setStatus("error");

      const code = err.code || "UNKNOWN_CODE";
      const reason =
        err.info?.error?.message || err.shortMessage || err.message;

      addLog(`❌ ERROR (${code}):`);
      addLog(reason);
      toast.error(`Failed: ${code}`);
    } finally {
      if (status !== "error") setStatus("idle");
    }
  };

  return (
    <div className="bg-white rounded-[18px] p-5 shadow-sm border border-gray-100 flex flex-col gap-4 font-manrope">
      <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
        <div className="bg-[#8c8fff]/10 p-1.5 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-[#8c8fff]" />
        </div>
        <h3 className="font-extrabold text-sm text-[#1b1c23]">Native Send</h3>
      </div>

      <p className="text-xs text-gray-500 font-medium leading-relaxed">
        Attempts to send <b className="text-[#1b1c23]">0.000001 ETH</b> to
        yourself. This tests the raw connection, bypassing Smart Contracts.
      </p>

      <button
        onClick={handleNativeSend}
        disabled={status === "loading"}
        className="w-full py-3 bg-[#1b1c23] text-white rounded-xl font-bold text-xs hover:bg-[#2c2d33] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-gray-200"
      >
        {status === "loading" ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Send className="w-3 h-3" />
        )}
        Test Native Send
      </button>

      {logs.length > 0 && (
        <div className="bg-[#1b1c23] rounded-xl p-3 text-[10px] font-mono text-green-400 h-32 overflow-y-auto space-y-1 border border-gray-800 shadow-inner">
          {logs.map((log, i) => (
            <div
              key={i}
              className="break-all border-b border-gray-800/50 pb-1 last:border-0 opacity-90"
            >
              <span className="opacity-50 mr-2">{">"}</span>
              {log.split(">").pop()?.trim()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
