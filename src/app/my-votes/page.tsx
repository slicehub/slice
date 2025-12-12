"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Gavel,
  Eye,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Wallet,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { fetchJSONFromIPFS } from "@/util/ipfs";
import { useSliceContract } from "@/hooks/useSliceContract";
import { useXOContracts } from "@/providers/XOContractsProvider";
import { hasLocalVote } from "@/util/votingStorage";

interface Task {
  id: string;
  title: string;
  category: string;
  phase: "VOTE" | "REVEAL";
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
        const disputeIds = await contract.getJurorDisputes(address);

        const loadedTasks = await Promise.all(
          disputeIds.map(async (idBigInt: bigint) => {
            const id = idBigInt.toString();
            const d = await contract.disputes(id);
            const status = Number(d.status); // 0=Created, 1=Commit, 2=Reveal, 3=Finished

            // --- FILTERING LOGIC: Is this actionable? ---
            const hasRevealed = await contract.hasRevealed(id, address);
            const localSecretExists = hasLocalVote(contractAddr, id, address);

            let isActionable = false;
            let phase: Task["phase"] = "VOTE"; // Default
            let deadline = 0;

            // CASE 1: COMMIT PHASE (1) & No Local Vote Secret found
            if (status === 1 && !localSecretExists) {
              isActionable = true;
              phase = "VOTE";
              deadline = Number(d.commitDeadline);
            }
            // CASE 2: REVEAL PHASE (2) & Has Local Secret & Not Revealed On-Chain
            else if (status === 2 && localSecretExists && !hasRevealed) {
              isActionable = true;
              phase = "REVEAL";
              deadline = Number(d.revealDeadline);
            }

            // If not actionable, return null (to be filtered out)
            if (!isActionable) return null;

            // --- If we are here, it's a valid task. Fetch metadata. ---
            let title = `Dispute #${id}`;
            if (d.ipfsHash) {
              const meta = await fetchJSONFromIPFS(d.ipfsHash);
              if (meta?.title) title = meta.title;
            }

            const now = Math.floor(Date.now() / 1000);
            const diff = deadline - now;
            const deadlineLabel =
              diff > 0 ? `${Math.ceil(diff / 3600)}h remaining` : "Ending soon";

            // Styling
            const style =
              phase === "VOTE"
                ? {
                    color: "text-blue-600",
                    bg: "bg-blue-50",
                    icon: <Gavel className="w-5 h-5" />,
                  }
                : {
                    color: "text-purple-600",
                    bg: "bg-purple-50",
                    icon: <Eye className="w-5 h-5" />,
                  };

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

        // Filter nulls and sort by deadline urgency (closest first)
        const activeTasks = loadedTasks.filter((t): t is Task => t !== null);
        setTasks(activeTasks);
      } catch (e) {
        console.error("Error fetching tasks:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJurorTasks();
  }, [address, contract]);

  const handleAction = (task: Task) => {
    if (task.phase === "VOTE") router.push(`/vote/${task.id}`);
    else router.push(`/reveal/${task.id}`);
  };

  const handleDetails = (id: string) => {
    router.push(`/disputes/${id}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-manrope pb-32">
      {/* Header */}
      <div className="pt-12 px-6 pb-4 bg-white shadow-sm z-10 sticky top-0">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 mt-1 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0 shadow-sm border border-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-[#1b1c23]" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-[#1b1c23]">Inbox</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">
              {tasks.length} pending actions require your attention.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {!address ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Wallet className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="font-bold text-[#1b1c23]">Wallet Not Connected</h3>
            <button
              onClick={() => connect()}
              className="mt-4 px-6 py-3 bg-[#1b1c23] text-white rounded-xl font-bold"
            >
              Connect Wallet
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-[#8c8fff] mb-2" />
            <p className="text-xs text-gray-400">Syncing inbox...</p>
          </div>
        ) : tasks.length === 0 ? (
          /* INBOX ZERO STATE */
          <div className="flex flex-col items-center justify-center py-20 text-center px-6 animate-in fade-in zoom-in-95">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-4 border border-green-100">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-xl font-extrabold text-[#1b1c23]">
              You're all caught up!
            </h3>
            <p className="text-sm text-gray-500 mt-2 max-w-[200px] mx-auto">
              No pending votes or reveals. Check your portfolio for history.
            </p>
            <button
              onClick={() => router.push("/disputes")}
              className="mt-6 px-6 py-3 bg-white border border-gray-200 text-[#1b1c23] rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm"
            >
              View Portfolio
            </button>
          </div>
        ) : (
          /* TASK LIST */
          <div className="flex flex-col gap-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 flex flex-col gap-4"
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
                    {task.phase} NOW
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-500">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {task.deadlineLabel}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDetails(task.id)}
                      className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-[#1b1c23] transition-colors"
                      title="View Details"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleAction(task)}
                      className={`px-5 py-2 rounded-xl text-xs font-extrabold text-white shadow-md transition-all hover:scale-105 active:scale-95 ${
                        task.phase === "REVEAL"
                          ? "bg-[#8c8fff]"
                          : "bg-[#1b1c23]"
                      }`}
                    >
                      {task.phase === "REVEAL" ? "Reveal" : "Vote"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
