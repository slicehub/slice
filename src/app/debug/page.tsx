"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Shield,
  Gavel,
  Eye,
  Database,
  Terminal,
  CheckCircle,
  Hash,
  Play,
  CreditCard,
  User,
  Plus,
  List,
  Clock,
  Copy,
} from "lucide-react";

import { useSliceContract } from "@/hooks/useSliceContract";
import { useXOContracts } from "@/providers/XOContractsProvider";
import { useSliceVoting } from "@/hooks/useSliceVoting";
import { useCreateDispute } from "@/hooks/useCreateDispute";
import { usePayDispute } from "@/hooks/usePayDispute";
import { formatUnits } from "ethers";
import { toast } from "sonner";
import { calculateCommitment, generateSalt } from "@/util/votingUtils";
import { getVoteData } from "@/util/votingStorage";

export default function DebugPage() {
  const router = useRouter();
  const { address } = useXOContracts();
  const contract = useSliceContract();

  // Hooks
  const {
    commitVote,
    revealVote,
    isProcessing: isVoting,
    logs,
  } = useSliceVoting();
  const { createDispute, isCreating } = useCreateDispute();
  const { payDispute, isPaying } = usePayDispute();

  // --- State ---
  const [targetId, setTargetId] = useState("1");
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [rawDisputeData, setRawDisputeData] = useState<any>(null);
  const [localStorageData, setLocalStorageData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // My Context Lists
  const [myPartyDisputes, setMyPartyDisputes] = useState<string[]>([]);
  const [myJurorDisputes, setMyJurorDisputes] = useState<string[]>([]);

  // --- Tool State ---
  const [toolSalt, setToolSalt] = useState("");
  const [toolVote] = useState<number>(1);
  const [toolHash, setToolHash] = useState("");
  const [saltCopied, setSaltCopied] = useState(false);

  // --- 1. Global & Context Fetching ---
  const refreshGlobalState = useCallback(async () => {
    if (!contract || !address) return;
    try {
      // 1. Contract Global Stats
      const count = await contract.disputeCount();

      // 2. My Context (Party)
      const userDisputeIds = await contract.getUserDisputes(address);
      setMyPartyDisputes(userDisputeIds.map((id: bigint) => id.toString()));

      // 3. My Context (Juror)
      const jurorDisputeIds = await contract.getJurorDisputes(address);
      setMyJurorDisputes(jurorDisputeIds.map((id: bigint) => id.toString()));

      setContractInfo({ count: count.toString() });
    } catch (e) {
      console.error(e);
      toast.error("Failed to sync contract state");
    }
  }, [contract, address]);

  useEffect(() => {
    refreshGlobalState();
  }, [refreshGlobalState]);

  // --- 2. Dispute Inspector ---
  const fetchRawDispute = async () => {
    if (!contract || !targetId) return;
    setIsLoadingData(true);
    try {
      const d = await contract.disputes(targetId);
      const statusLabels = ["Created", "Commit", "Reveal", "Executed"];

      // Check if current user is involved
      const isClaimer = d.claimer.toLowerCase() === address?.toLowerCase();
      const isDefender = d.defender.toLowerCase() === address?.toLowerCase();
      const hasRevealed = await contract.hasRevealed(targetId, address);

      const formatted = {
        id: d.id.toString(),
        statusIndex: Number(d.status),
        status: statusLabels[Number(d.status)] || "Unknown",
        claimer: d.claimer,
        defender: d.defender,
        category: d.category,
        jurorsRequired: d.jurorsRequired.toString(),
        requiredStake: formatUnits(d.requiredStake, 6) + " USDC",
        payDeadline: new Date(Number(d.payDeadline) * 1000).toLocaleString(),
        commitDeadline: new Date(
          Number(d.commitDeadline) * 1000,
        ).toLocaleString(),
        revealDeadline: new Date(
          Number(d.revealDeadline) * 1000,
        ).toLocaleString(),
        ipfsHash: d.ipfsHash || "None",
        winner:
          d.winner === "0x0000000000000000000000000000000000000000"
            ? "None"
            : d.winner,
        userRole: isClaimer
          ? "Claimer"
          : isDefender
            ? "Defender"
            : "None/Juror",
        hasRevealedOnChain: hasRevealed,
      };
      setRawDisputeData(formatted);

      // Fetch Local Secrets for this ID
      if (contract.target && address) {
        const stored = getVoteData(
          contract.target as string,
          targetId,
          address,
        );
        setLocalStorageData(stored);
      }
    } catch (e) {
      console.error(e);
      toast.error(`Dispute #${targetId} not found`);
      setRawDisputeData(null);
    } finally {
      setIsLoadingData(false);
    }
  };

  // --- 3. Interactive Actions ---
  const handleQuickCreate = async () => {
    if (!address) return toast.error("Connect wallet");

    // Create a dispute against self for testing, or a random address
    const randomAddress = "0x000000000000000000000000000000000000dead";

    const success = await createDispute(
      randomAddress,
      "General",
      {
        title: `Debug Dispute ${Date.now()}`,
        description: "Auto-generated for debugging purposes.",
        evidence: [],
      },
      3, // 3 Jurors
    );

    if (success) {
      setTimeout(refreshGlobalState, 2000);
    }
  };

  const handleJoin = async () => {
    if (!contract) return;
    try {
      toast.info("Joining jury...");
      // Assuming mock stake for now or fetching from contract if needed
      // For debug join we usually don't have the allowance flow here unless we replicate useAssignDispute
      // Direct contract call for speed if allowance exists
      const tx = await contract.joinDispute(targetId);
      await tx.wait();
      toast.success("Joined successfully");
      fetchRawDispute();
      refreshGlobalState();
    } catch (e: any) {
      // If it fails likely due to allowance, warn user
      if (e.message.includes("allowance") || e.code === "CALL_EXCEPTION") {
        toast.error("Join failed. Check USDC Allowance.");
      } else {
        toast.error("Join failed: " + (e.reason || e.message));
      }
    }
  };

  const handlePay = async () => {
    // Just pay 1 USDC for debug
    const amountStr = "1.0";
    await payDispute(targetId, amountStr);
    fetchRawDispute();
  };

  const handleExecute = async () => {
    if (!contract) return;
    try {
      toast.info("Executing ruling...");
      const tx = await contract.executeRuling(targetId);
      await tx.wait();
      toast.success("Ruling Executed");
      fetchRawDispute();
    } catch (e: any) {
      toast.error(e.reason || e.message || "Execution failed");
    }
  };

  // --- 4. Tool Logic ---
  const handleCalculateHash = () => {
    if (!toolSalt) {
      const s = generateSalt();
      setToolSalt(s.toString());
      const h = calculateCommitment(toolVote, s);
      setToolHash(h);
    } else {
      try {
        const h = calculateCommitment(toolVote, BigInt(toolSalt));
        setToolHash(h);
      } catch (_e) {
        toast.error("Invalid salt");
      }
    }
  };

  const handleCopySalt = () => {
    if (!localStorageData?.salt) return;
    navigator.clipboard.writeText(localStorageData.salt);
    setSaltCopied(true);
    setTimeout(() => setSaltCopied(false), 2000);
    toast.success("Salt copied to clipboard");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-manrope pb-20">
      {/* Header */}
      <div className="pt-8 px-6 pb-4 bg-white shadow-sm sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-[#1b1c23]" />
          </button>
          <h1 className="text-xl font-extrabold text-[#1b1c23] flex items-center gap-2">
            <Terminal className="w-6 h-6 text-[#8c8fff]" />
            Debug Console
          </h1>
        </div>
        <button
          onClick={refreshGlobalState}
          className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors text-[#1b1c23]"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-6 overflow-y-auto">
        {/* --- Global Stats & Quick Factory --- */}
        <div className="bg-white rounded-[18px] p-5 shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Total Disputes
            </span>
            <p className="text-3xl font-extrabold text-[#1b1c23]">
              {contractInfo ? contractInfo.count : "-"}
            </p>
          </div>
          <button
            onClick={handleQuickCreate}
            disabled={isCreating}
            className="flex items-center gap-2 px-4 py-2 bg-[#1b1c23] text-white rounded-xl font-bold text-xs hover:bg-[#2c2d33] transition-colors shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isCreating ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
            Quick Create
          </button>
        </div>

        {/* --- My Context (Involvements) --- */}
        {(myPartyDisputes.length > 0 || myJurorDisputes.length > 0) && (
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-sm text-[#1b1c23] uppercase tracking-wider ml-1 flex items-center gap-2">
              <User className="w-4 h-4 text-[#8c8fff]" /> My Involvements
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {/* Party Disputes */}
              {myPartyDisputes.map((id) => (
                <button
                  key={`party-${id}`}
                  onClick={() => {
                    setTargetId(id);
                    fetchRawDispute();
                  }}
                  className={`shrink-0 px-4 py-2 rounded-xl border font-bold text-xs transition-all ${
                    targetId === id
                      ? "bg-[#1b1c23] text-white border-[#1b1c23]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#8c8fff]"
                  }`}
                >
                  #{id} (Party)
                </button>
              ))}
              {/* Juror Disputes */}
              {myJurorDisputes.map((id) => (
                <button
                  key={`juror-${id}`}
                  onClick={() => {
                    setTargetId(id);
                    fetchRawDispute();
                  }}
                  className={`shrink-0 px-4 py-2 rounded-xl border font-bold text-xs transition-all ${
                    targetId === id
                      ? "bg-[#8c8fff] text-white border-[#8c8fff]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#8c8fff]"
                  }`}
                >
                  #{id} (Juror)
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- Target Controller --- */}
        <div className="bg-white p-2 rounded-[18px] border border-gray-100 shadow-sm flex items-center gap-2">
          <div className="pl-3">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="number"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="Dispute ID..."
            className="flex-1 p-2 outline-none text-[#1b1c23] font-bold bg-transparent font-mono"
          />
          <button
            onClick={fetchRawDispute}
            disabled={isLoadingData}
            className="bg-[#f5f6f9] text-[#1b1c23] px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors"
          >
            {isLoadingData ? "..." : "Fetch"}
          </button>
        </div>

        {/* --- Dispute Inspector & Actions --- */}
        {rawDisputeData && (
          <div className="bg-white rounded-[24px] p-6 shadow-md border border-gray-100 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Header Status */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#1b1c23] flex items-center gap-2">
                  #{rawDisputeData.id}
                  <span className="text-sm font-medium text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded-lg">
                    {rawDisputeData.category}
                  </span>
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                      rawDisputeData.statusIndex === 0
                        ? "bg-blue-100 text-blue-700"
                        : rawDisputeData.statusIndex === 1
                          ? "bg-purple-100 text-purple-700"
                          : rawDisputeData.statusIndex === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                    }`}
                  >
                    {rawDisputeData.status} Phase
                  </span>
                  {rawDisputeData.userRole !== "None/Juror" && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#1b1c23] text-white">
                      You are {rawDisputeData.userRole}
                    </span>
                  )}
                </div>
              </div>
              {/* IPFS Link */}
              {rawDisputeData.ipfsHash !== "None" && (
                <a
                  href={`https://gateway.pinata.cloud/ipfs/${rawDisputeData.ipfsHash}`}
                  target="_blank"
                  className="p-2 bg-[#f5f6f9] rounded-lg hover:bg-gray-200 transition-colors"
                  title="View Metadata"
                >
                  <List className="w-4 h-4 text-[#1b1c23]" />
                </a>
              )}
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-gray-400 font-bold uppercase">
                  Jurors
                </span>
                <span className="font-mono text-[#1b1c23] font-semibold">
                  {rawDisputeData.jurorsRequired} Needed
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-gray-400 font-bold uppercase">Stake</span>
                <span className="font-mono text-[#1b1c23] font-semibold">
                  {rawDisputeData.requiredStake}
                </span>
              </div>
              <div className="col-span-2 flex flex-col gap-1 bg-[#f5f6f9] p-3 rounded-xl">
                <span className="text-gray-400 font-bold uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Deadlines
                </span>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div>
                    <span className="block text-[9px] text-gray-400">Pay</span>
                    <span className="font-mono font-bold">
                      {rawDisputeData.payDeadline.split(",")[0]}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-gray-400">
                      Commit
                    </span>
                    <span className="font-mono font-bold">
                      {rawDisputeData.commitDeadline.split(",")[0]}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-gray-400">
                      Reveal
                    </span>
                    <span className="font-mono font-bold">
                      {rawDisputeData.revealDeadline.split(",")[0]}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* --- Context Actions Panel --- */}
            <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
              <h3 className="font-bold text-xs text-[#8c8fff] uppercase tracking-wider">
                Available Actions
              </h3>

              {/* --- Context Actions Panel --- */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleJoin}
                  className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 active:scale-[0.98] transition-all border border-blue-100 shadow-sm"
                >
                  <div className="p-2 bg-white rounded-full shadow-sm">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold">Join Jury</span>
                </button>

                <button
                  onClick={handlePay}
                  disabled={isPaying}
                  className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 active:scale-[0.98] transition-all border border-green-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-2 bg-white rounded-full shadow-sm">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold">Pay Stake</span>
                </button>

                <button
                  onClick={() => commitVote(targetId, 1)}
                  disabled={isVoting}
                  className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 active:scale-[0.98] transition-all border border-gray-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-2 bg-white rounded-full shadow-sm">
                    <Gavel className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold">Vote (1)</span>
                </button>

                <button
                  onClick={() => revealVote(targetId)}
                  disabled={isVoting}
                  className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 active:scale-[0.98] transition-all border border-purple-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-2 bg-white rounded-full shadow-sm">
                    <Eye className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold">Reveal</span>
                </button>
              </div>

              <button
                onClick={handleExecute}
                className="w-full py-3.5 bg-[#1b1c23] text-white rounded-xl font-bold text-xs hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md mt-1"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Force Execute Ruling
              </button>

              {logs && (
                <div className="p-4 bg-gray-900 rounded-xl text-[10px] font-mono text-green-400 whitespace-pre-wrap border border-gray-800 shadow-inner">
                  <span className="opacity-50 mr-2">{">"}</span>
                  {logs}
                </div>
              )}
            </div>

            {/* --- Local Storage Inspector --- */}
            {/* --- Local Storage Inspector --- */}
            {localStorageData && (
              <div className="bg-[#f5f6f9] p-4 rounded-xl border border-dashed border-gray-300 flex flex-col gap-3">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <Database className="w-3 h-3" /> Local Secrets Found
                  </span>
                  <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                    <CheckCircle className="w-3 h-3" />
                    <span className="text-[10px] font-bold">Persisted</span>
                  </div>
                </div>

                {/* Vote Data */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-gray-500">Vote Choice:</span>
                  <span className="bg-white border border-gray-200 px-2 py-1 rounded-md font-mono font-bold text-[#1b1c23]">
                    {localStorageData.vote}
                  </span>
                </div>

                {/* Salt Data with Copy */}
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-gray-500 text-xs">
                    Secret Salt:
                  </span>
                  <div className="flex items-start gap-2">
                    {/* Display truncated salt using slice() */}
                    <div
                      className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-[10px] font-mono text-[#1b1c23] break-all leading-relaxed"
                      title={localStorageData.salt}
                    >
                      {localStorageData.salt.length > 20
                        ? `${localStorageData.salt.slice(0, 10)}...${localStorageData.salt.slice(-4)}`
                        : localStorageData.salt}
                    </div>
                    {/* Copy button uses the FULL salt from state */}
                    <button
                      onClick={handleCopySalt}
                      className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95 transition-all text-gray-500 hover:text-[#1b1c23] shrink-0"
                      title="Copy Full Salt"
                    >
                      {saltCopied ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Tools Section (Collapsed-ish) --- */}
        <div className="bg-white rounded-[18px] p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
          <h3 className="font-bold text-sm text-[#1b1c23] flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#8c8fff]" /> Crypto Tools
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Salt (Generate →)"
              value={toolSalt}
              onChange={(e) => setToolSalt(e.target.value)}
              className="flex-1 bg-[#f5f6f9] rounded-lg p-2 text-xs font-mono"
            />
            <button
              onClick={handleCalculateHash}
              className="px-3 bg-gray-100 rounded-lg text-xs font-bold hover:bg-gray-200"
            >
              Calc Hash
            </button>
          </div>
          {toolHash && (
            <div className="p-2 bg-gray-900 rounded-lg text-[9px] font-mono text-white break-all">
              {toolHash}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .debug-btn {
          @apply flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
        }
      `}</style>
    </div>
  );
}
