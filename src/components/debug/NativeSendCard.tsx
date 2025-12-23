import React, { useState } from "react";
import { parseEther } from "ethers";
import { toast } from "sonner";
import { useConnect } from "@/providers/ConnectProvider";
import { Send, Loader2, AlertTriangle } from "lucide-react";

export const NativeSendCard = () => {
  const { signer, address } = useConnect();
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) =>
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} > ${msg}`]);

  const handleNativeSend = async () => {
    if (!signer || !address) {
      toast.error("No signer available");
      return;
    }

    setStatus("loading");
    setLogs([]);
    addLog("Starting Native ETH Transfer...");

    try {
      // 1. Get Network Details
      const network = await signer.provider?.getNetwork();
      addLog(`Signer Network: Chain ID ${network?.chainId}`);

      // 2. Construct Minimal Transaction
      // We DO NOT manually populate gas or nonce. We let the wallet handle it.
      const txPayload = {
        to: address, // Send to self
        value: parseEther("0.000001"), // Tiny amount
      };

      addLog(`Payload: ${JSON.stringify(txPayload)}`);

      // 3. Send
      addLog("Requesting Signature...");
      const tx = await signer.sendTransaction(txPayload);

      addLog(`Tx Sent! Hash: ${tx.hash}`);
      toast.success("Native Transaction Sent!");
      setStatus("success");

      addLog("Waiting for confirmation...");
      await tx.wait();
      addLog("Transaction Confirmed on-chain.");
    } catch (err: any) {
      console.error("Native Send Error", err);
      setStatus("error");

      // Extract useful error info
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
    <div className="bg-white rounded-[18px] p-5 shadow-sm border border-indigo-100 flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-indigo-50 pb-2">
        <div className="bg-indigo-50 p-1.5 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-indigo-500" />
        </div>
        <h3 className="font-bold text-sm text-[#1b1c23]">Debugger Send</h3>
      </div>

      <p className="text-xs text-gray-500">
        Attempts to send <b>0.000001 ETH</b> to yourself. This tests the raw
        connection, bypassing Smart Contracts.
      </p>

      <button
        onClick={handleNativeSend}
        disabled={status === "loading"}
        className="w-full py-3 bg-indigo-500 text-white rounded-xl font-bold text-xs hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {status === "loading" ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Send className="w-3 h-3" />
        )}
        Test Native Send
      </button>

      {logs.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-3 text-[10px] font-mono text-green-400 h-32 overflow-y-auto space-y-1">
          {logs.map((log, i) => (
            <div
              key={i}
              className="break-all border-b border-gray-800 pb-0.5 last:border-0"
            >
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
