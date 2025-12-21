"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Terminal, Search } from "lucide-react";
import { toast } from "sonner";
import { formatUnits } from "ethers";

// Hooks
import { useSliceContract } from "@/hooks/useSliceContract";
import { useContracts } from "@/providers/ConnectProvider";
import { useSliceVoting } from "@/hooks/useSliceVoting";
import { useCreateDispute } from "@/hooks/useCreateDispute";
import { usePayDispute } from "@/hooks/usePayDispute";
import { getVoteData } from "@/util/votingStorage";

// Components
import { GlobalStateCard } from "@/components/debug/GlobalStateCard";
import { DisputeInspector } from "@/components/debug/DisputeInspector";
import { CryptoToolsCard } from "@/components/debug/CryptoToolsCard";

export default function DebugPage() {
  const router = useRouter();
  const { address } = useContracts();
  const contract = useSliceContract();

  // Logic Hooks
  const {
    commitVote,
    revealVote,
    isProcessing: isVoting,
    logs,
  } = useSliceVoting();
  const { createDispute, isCreating } = useCreateDispute();
  const { payDispute, isPaying } = usePayDispute();

  // State
  const [targetId, setTargetId] = useState("1");
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [rawDisputeData, setRawDisputeData] = useState<any>(null);
  const [localStorageData, setLocalStorageData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [myPartyDisputes, setMyPartyDisputes] = useState<string[]>([]);
  const [myJurorDisputes, setMyJurorDisputes] = useState<string[]>([]);

  // --- 1. Global & Context Fetching ---
  const refreshGlobalState = useCallback(async () => {
    if (!contract || !address) return;
    try {
      const count = await contract.disputeCount();
      // Ensure your contract has these view functions, or remove if not available
      const userDisputeIds = await contract.getUserDisputes(address);
      const jurorDisputeIds = await contract.getJurorDisputes(address);

      setMyPartyDisputes(userDisputeIds.map((id: bigint) => id.toString()));
      setMyJurorDisputes(jurorDisputeIds.map((id: bigint) => id.toString()));
      setContractInfo({ count: count.toString() });
    } catch (e) {
      console.error(e);
      // Fail silently for smoother UX on partial loads
    }
  }, [contract, address]);

  useEffect(() => {
    refreshGlobalState();
  }, [refreshGlobalState]);

  // --- 2. Dispute Inspector Fetcher ---
  const fetchRawDispute = async () => {
    if (!contract || !targetId) return;
    setIsLoadingData(true);
    try {
      const d = await contract.disputes(targetId);
      const statusLabels = ["Created", "Commit", "Reveal", "Executed"];
      const isClaimer = d.claimer.toLowerCase() === address?.toLowerCase();
      const isDefender = d.defender.toLowerCase() === address?.toLowerCase();
      // Safe check for hasRevealed
      let hasRevealed = false;
      try {
        hasRevealed = await contract.hasRevealed(targetId, address);
      } catch (e) {
        console.error("hasRevealed check failed", e);
        toast.warning?.(
          "Unable to load on-chain reveal status. Displaying status as not revealed.",
        );
      }

      setRawDisputeData({
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
            ? "Pending/None"
            : d.winner,
        userRole: isClaimer
          ? "Claimer"
          : isDefender
            ? "Defender"
            : "None/Juror",
        hasRevealedOnChain: hasRevealed,
      });

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

  // --- 3. Action Handlers ---
  const handleQuickCreate = async () => {
    if (!address) return toast.error("Connect wallet");

    // Customize your dummy data here
    const success = await createDispute(
      "0x000000000000000000000000000000000000dead", // Defender (Dead address for debug)
      "General",
      {
        title: `Debug Dispute ${Date.now()}`,
        description: "This is a test dispute created via the Debug Console.",
        evidence: [],
      },
      3, // Jurors required
    );

    if (success) {
      setTimeout(refreshGlobalState, 2000); // Wait for block
    }
  };

  const handleJoin = async () => {
    if (!contract) return;
    try {
      toast.info("Joining jury...");
      const tx = await contract.joinDispute(targetId);
      await tx.wait();
      toast.success("Joined successfully");
      fetchRawDispute();
      refreshGlobalState();
    } catch (e: any) {
      toast.error("Join failed: " + (e.reason || e.message));
    }
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

  const handleSelectId = (id: string) => {
    setTargetId(id);
    // Add small timeout to visual feedback
    setTimeout(() => {
      const btn = document.getElementById("btn-fetch");
      if (btn) btn.click();
    }, 100);
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
            <Terminal className="w-6 h-6 text-[#8c8fff]" /> Debug Console
          </h1>
        </div>
        <button
          onClick={refreshGlobalState}
          className="w-10 h-10 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors text-[#1b1c23] flex items-center justify-center"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-6 overflow-y-auto">
        <GlobalStateCard
          contractInfo={contractInfo}
          isCreating={isCreating}
          onCreate={handleQuickCreate}
          myPartyDisputes={myPartyDisputes}
          myJurorDisputes={myJurorDisputes}
          targetId={targetId}
          onSelectId={handleSelectId}
        />

        {/* Search Bar */}
        <div className="bg-white p-2 rounded-[18px] border border-gray-100 shadow-sm flex items-center gap-2 sticky top-[80px] z-10">
          <div className="pl-3">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="number"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="Enter Dispute ID..."
            className="flex-1 p-2 outline-none text-[#1b1c23] font-bold bg-transparent font-mono"
          />
          <button
            id="btn-fetch"
            onClick={fetchRawDispute}
            disabled={isLoadingData}
            className="bg-[#f5f6f9] text-[#1b1c23] px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors min-w-[80px]"
          >
            {isLoadingData ? "..." : "Fetch"}
          </button>
        </div>

        <DisputeInspector
          data={rawDisputeData}
          localStorageData={localStorageData}
          onJoin={handleJoin}
          onPay={() =>
            payDispute(targetId, "1.0").then(() => fetchRawDispute())
          }
          onVote={(val) => commitVote(targetId, val)}
          onReveal={() => revealVote(targetId)}
          onExecute={handleExecute}
          isPaying={isPaying}
          isVoting={isVoting}
          logs={logs}
        />

        <CryptoToolsCard />
      </div>
    </div>
  );
}
