"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Gavel,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Wallet,
} from "lucide-react";
import { fetchJSONFromIPFS } from "@/util/ipfs";
import { useSliceContract } from "@/hooks/useSliceContract";
import { useXOContracts } from "@/providers/XOContractsProvider";
import { hasLocalVote } from "@/util/votingStorage";

interface Task {
  id: string;
  title: string;
  category: string;
  phase: "VOTE" | "REVEAL" | "WAITING" | "DONE";
  deadlineLabel: string;
  statusColor: string;
  bgColor: string;
  icon: React.ReactNode;
}

export default function MyVotesPage() {
  const router = useRouter();
  const { address, connect } = useXOContracts();
  const contract = useSliceContract();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchJurorTasks = async () => {
      if (!address || !contract || !contract.target) return;
      const contractAddr = contract.target as string;
      setIsLoading(true);

      try {
        // 1. Fetch IDs from Chain (Source of Truth)
        const disputeIds = await contract.getJurorDisputes(address);

        // 2. Fetch details for all IDs in parallel
        const loadedTasks = await Promise.all(
          disputeIds.map(async (idBigInt: bigint) => {
            const id = idBigInt.toString();

            // A. Fetch On-Chain Data
            const d = await contract.disputes(id);
            const status = Number(d.status); // 0=Created, 1=Commit, 2=Reveal, 3=Finished

            // B. Fetch Off-Chain Metadata (IPFS) for Title
            let title = `Dispute #${id}`;
            if (d.ipfsHash) {
              const meta = await fetchJSONFromIPFS(d.ipfsHash);
              if (meta?.title) title = meta.title;
            }

            // C. Determine User Status
            const hasRevealed = await contract.hasRevealed(id, address);
            // Check local storage only for the "Secret" needed to reveal
            const localSecretExists = hasLocalVote(contractAddr, id, address);

            // D. Calculate Phase
            let phase: Task["phase"] = "WAITING";
            let deadline = 0;

            if (status === 1) {
              // Commit Phase
              deadline = Number(d.commitDeadline);
              phase = localSecretExists ? "WAITING" : "VOTE"; // If secret exists, they voted
            } else if (status === 2) {
              // Reveal Phase
              deadline = Number(d.revealDeadline);
              phase = hasRevealed ? "DONE" : "REVEAL";
            } else if (status === 3) {
              phase = "DONE";
            }

            // E. Formatting
            const now = Math.floor(Date.now() / 1000);
            const diff = deadline - now;
            const deadlineLabel =
              diff > 0 ? `${Math.ceil(diff / 3600)}h remaining` : "Ended";

            // Styling Helpers
            const getStyles = (p: string) => {
              if (p === "VOTE")
                return {
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                  icon: <Gavel className="w-5 h-5" />,
                };
              if (p === "REVEAL")
                return {
                  color: "text-purple-600",
                  bg: "bg-purple-50",
                  icon: <Eye className="w-5 h-5" />,
                };
              if (p === "DONE")
                return {
                  color: "text-green-600",
                  bg: "bg-green-50",
                  icon: <CheckCircle2 className="w-5 h-5" />,
                };
              return {
                color: "text-gray-500",
                bg: "bg-gray-100",
                icon: <Clock className="w-5 h-5" />,
              };
            };

            const style = getStyles(phase);

            return {
              id,
              title,
              category: d.category,
              phase,
              deadlineLabel,
              statusColor: style.color,
              bgColor: style.bg,
              icon: style.icon,
            };
          }),
        );

        // Sort: Actionable items first
        setTasks(
          loadedTasks.sort((a) =>
            a.phase === "VOTE" || a.phase === "REVEAL" ? -1 : 1,
          ),
        );
      } catch (e) {
        console.error("Error fetching juror tasks:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJurorTasks();
  }, [address, contract]);

  const handleAction = (task: Task) => {
    if (task.phase === "VOTE") {
      router.push(`/vote/${task.id}`);
    } else if (task.phase === "REVEAL") {
      router.push(`/reveal/${task.id}`);
    }
  };

  const pendingCount = tasks.filter(
    (t) => t.phase === "VOTE" || t.phase === "REVEAL",
  ).length;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-manrope pb-32">
      <div className="pt-12 px-6 pb-4 bg-white shadow-[0px_2px_4px_0px_rgba(27,28,35,0.02)] z-10 sticky top-0">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 mt-1 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0 shadow-sm border border-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-[#1b1c23]" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-[#1b1c23]">
              Jury Duty
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Manage your active cases and earning status.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* 3. NOT CONNECTED STATE */}
        {!address && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
              <Wallet className="w-10 h-10 text-gray-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#1b1c23] text-lg">
                Wallet Not Connected
              </h3>
              <p className="text-sm text-gray-500 mt-2 font-medium">
                Please connect your wallet to view your active jury duties.
              </p>
            </div>
            <button
              onClick={() => connect()}
              className="mt-2 px-8 py-3.5 bg-[#1b1c23] text-white rounded-xl font-semibold shadow-lg hover:bg-[#2c2d33] transition-all active:scale-95"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {/* Only show stats and tasks if connected */}
        {address && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="bg-[#1b1c23] p-4 rounded-2xl text-white shadow-lg">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                  Pending Actions
                </span>
                <div className="text-3xl font-extrabold mt-1">
                  {pendingCount}
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-[#1b1c23]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                  Jury Score
                </span>
                <div className="text-3xl font-extrabold mt-1 flex items-center gap-1">
                  98{" "}
                  <span className="text-sm text-green-500 font-bold">A+</span>
                </div>
              </div>
            </div>

            <h3 className="font-extrabold  text-[#1b1c23] uppercase tracking-wide ml-1 mt-2">
              Your Tasks
            </h3>

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#8c8fff]" />
                <p className="text-xs text-gray-400">Syncing disputes...</p>
              </div>
            )}

            {!isLoading && tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center px-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1b1c23]">All Caught Up!</h3>
                  <p className="text-sm text-gray-500">
                    You have no active disputes. Join more via the Disputes tab.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white p-5 rounded-[20px] shadow-[0px_2px_8px_0px_rgba(27,28,35,0.04)] border border-gray-100 flex flex-col gap-4 transition-transform active:scale-[0.99]"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${task.bgColor} flex items-center justify-center shrink-0`}
                      >
                        {task.icon}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[#1b1c23] leading-tight">
                          {task.title}
                        </h4>
                        <span className="text-xs font-bold text-gray-400">
                          {task.category}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide ${task.bgColor} ${task.statusColor}`}
                    >
                      {task.phase === "WAITING" ? "VOTED" : task.phase}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {task.deadlineLabel}
                    </div>

                    {task.phase === "VOTE" || task.phase === "REVEAL" ? (
                      <button
                        onClick={() => handleAction(task)}
                        className={`px-5 py-2 rounded-xl text-xs font-extrabold text-white shadow-md transition-all hover:opacity-90 ${
                          task.phase === "REVEAL"
                            ? "bg-[#8c8fff]"
                            : "bg-[#1b1c23]"
                        }`}
                      >
                        {task.phase === "REVEAL" ? "Reveal Vote" : "Cast Vote"}
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-gray-300 italic flex items-center gap-1">
                        {task.phase === "DONE" ? "Completed" : "Submitted"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
