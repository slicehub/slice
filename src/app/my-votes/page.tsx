"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Gavel,
  Eye,
  Loader2,
  ArrowLeft,
  Wallet,
  CheckCircle2,
  ArrowRight,
  Coins,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { useSliceConnect } from "@/hooks/useSliceConnect"; // Updated
import { useDisputeList } from "@/hooks/useDisputeList";

export default function MyVotesPage() {
  const router = useRouter();
  // Updated hook usage
  const { address, connect } = useSliceConnect();

  const { disputes, isLoading } = useDisputeList("juror");

  const tasks = disputes.filter(
    (d) =>
      d.phase === "VOTE" ||
      d.phase === "REVEAL" ||
      (d.phase === "WITHDRAW" && d.status === 2),
  );

  const handleAction = (task: any) => {
    if (task.phase === "VOTE") router.push(`/vote/${task.id}`);
    else if (task.phase === "REVEAL") router.push(`/reveal/${task.id}`);
    else if (task.phase === "WITHDRAW")
      router.push(`/execute-ruling/${task.id}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FC] font-manrope pb-32 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#8c8fff]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="pt-10 px-6 pb-6 bg-[#F8F9FC]/90 backdrop-blur-md z-20 sticky top-0 border-b border-gray-100/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm active:scale-95 text-[#1b1c23]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-black text-[#1b1c23] tracking-tight">
              Your Missions
            </h1>
          </div>
          {tasks.length > 0 && (
            <div className="bg-[#8c8fff] text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg shadow-[#8c8fff]/30">
              {tasks.length} Pending
            </div>
          )}
        </div>
      </div>

      <div className="px-5 w-full flex flex-col gap-6 mt-2 relative z-10">
        {!address ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center mb-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <Wallet className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-black text-[#1b1c23]">
              Sync Your Profile
            </h3>
            <button
              onClick={() => connect()}
              className="mt-6 px-8 py-3.5 bg-[#1b1c23] text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gray-200"
            >
              Connect Wallet
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#8c8fff]" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
              Fetching Disputes...
            </p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-28 h-28 bg-gradient-to-tr from-white to-[#F0F2F5] rounded-full flex items-center justify-center mb-6 border-[6px] border-[#F8F9FC] shadow-xl">
              <CheckCircle2 className="w-12 h-12 text-[#8c8fff]" />
            </div>
            <h3 className="text-2xl font-black text-[#1b1c23] tracking-tight">
              All Clear!
            </h3>
            <p className="text-base text-gray-500 mt-2 max-w-[240px] mx-auto font-medium">
              Great job. You have no pending actions at the moment.
            </p>
            <button
              onClick={() => router.push("/disputes")}
              className="mt-8 px-6 py-3.5 bg-white border border-gray-100 text-[#1b1c23] rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]"
            >
              Browse Active Cases
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5 pb-10">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                onClick={() => handleAction(task)}
                className="group relative bg-white rounded-[28px] p-1 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_35px_-5px_rgba(140,143,255,0.15)] transition-all duration-300 cursor-pointer active:scale-[0.98] animate-in slide-in-from-bottom-4 fade-in fill-mode-forwards"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`absolute left-0 top-8 bottom-8 w-1.5 rounded-r-full ${
                    task.phase === "VOTE"
                      ? "bg-[#8c8fff]"
                      : task.phase === "REVEAL"
                        ? "bg-[#1b1c23]"
                        : "bg-emerald-500"
                  }`}
                />

                <div className="pl-6 pr-5 py-5 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-[#8c8fff] uppercase tracking-widest bg-[#8c8fff]/10 px-2 py-1 rounded-md">
                      {task.category}
                    </span>
                    {task.isUrgent && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-full animate-pulse">
                        <ShieldAlert className="w-3 h-3" /> Urgent
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <h4 className="font-extrabold text-lg text-[#1b1c23] leading-tight line-clamp-2">
                        {task.title}
                      </h4>
                      <div className="mt-1.5 flex items-center gap-2 text-xs font-bold text-gray-400">
                        <span className="font-mono text-gray-300">
                          #{task.id}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 text-[#8c8fff]" />
                          {task.stake} USDC Stake
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="h-px w-full bg-gradient-to-r from-transparent via-[#8c8fff]/20 to-transparent" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-xl ${
                          task.phase === "VOTE"
                            ? "bg-[#8c8fff]/10 text-[#8c8fff]"
                            : task.phase === "REVEAL"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {task.phase === "VOTE" ? (
                          <Gavel className="w-4 h-4" />
                        ) : task.phase === "REVEAL" ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <Zap className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                          Deadline
                        </span>
                        <span
                          className={`text-xs font-black ${
                            task.isUrgent ? "text-rose-500" : "text-[#1b1c23]"
                          }`}
                        >
                          {task.deadlineLabel}
                        </span>
                      </div>
                    </div>

                    <button
                      className={`
                        pl-5 pr-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all duration-300
                        ${
                          task.phase === "VOTE"
                            ? "bg-[#1b1c23] hover:bg-[#32363f]"
                            : task.phase === "REVEAL"
                              ? "bg-[#8c8fff] hover:bg-[#7a7de0] shadow-[#8c8fff]/20"
                              : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                        }
                      `}
                    >
                      {task.phase === "REVEAL"
                        ? "Reveal Vote"
                        : task.phase === "WITHDRAW"
                          ? "Claim Rewards"
                          : "Cast Vote"}
                      <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-1 transition-transform" />
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
