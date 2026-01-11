"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Trophy, Flame, Target, Wallet, ShieldAlert } from "lucide-react";
import { useJurorStats } from "@/hooks/useJurorStats";
import { useWithdraw } from "@/hooks/useWithdraw";
import { Button } from "@/components/ui/button";
import { PendingPaymentsDialog } from "@/components/profile/PendingPaymentsDialog";
import { PendingExecutionsDialog } from "@/components/profile/PendingExecutionsDialog";

export const ProfileOverview = () => {
  const router = useRouter();
  const { stats, rank } = useJurorStats();
  const { withdraw, isWithdrawing, claimableAmount, hasFunds } = useWithdraw();

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* 0. Action Alerts */}
      <div className="flex flex-col gap-0">
        <PendingPaymentsDialog />
        <PendingExecutionsDialog />
      </div>

      {/* Hero Card */}
      <div className="relative w-full rounded-4xl p-1 bg-linear-to-b from-gray-100 to-white shadow-xl shadow-gray-200/50">
        {/* Changed gap-6 to gap-4 to pull elements closer */}
        <div className="bg-[#1b1c23] rounded-[30px] p-6 pb-8 text-white flex flex-col items-center gap-4 relative overflow-hidden">
          {/* Avatar Section */}
          <div className="relative z-10 mt-2">
            <div className="w-28 h-28 rounded-full p-1 bg-linear-to-br from-[#8c8fff] to-blue-500 shadow-2xl relative">
              <div className="w-full h-full rounded-full border-[3px] border-[#1b1c23] overflow-hidden bg-[#2c2d33]">
                <img
                  src="/images/profiles-mockup/profile-1.jpg"
                  alt="Juror Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-linear-to-r from-[#8c8fff] to-[#7a7de0] text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-lg border-[3px] border-[#1b1c23] z-20 whitespace-nowrap">
                {rank}
              </div>
            </div>
          </div>

          {/* Name & Lifetime Earnings - Reduced internal gap */}
          <div className="flex flex-col items-center gap-1 z-10 w-full">
            <h2 className="font-manrope font-black text-2xl tracking-tight">
              {rank}
            </h2>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-80">
                Lifetime Earnings
              </span>
              <span className="text-lg font-black text-white tracking-tight">
                {stats.earnings} USDC
              </span>
            </div>
          </div>

          {/* Stats Grid - Moved closer via parent gap-4 */}
          <div className="grid grid-cols-3 divide-x divide-white/10 w-full bg-white/5 border border-white/5 rounded-2xl py-4 backdrop-blur-sm mt-1">
            <StatItem
              icon={<Target className="w-4 h-4 text-emerald-400" />}
              label="Accuracy"
              value={stats.accuracy}
              bg="bg-emerald-500/10"
            />
            <StatItem
              icon={<Trophy className="w-4 h-4 text-blue-400" />}
              label="Cases"
              value={stats.matches}
              bg="bg-blue-500/10"
            />
            <StatItem
              icon={<Flame className="w-4 h-4 text-orange-400" />}
              label="Wins"
              value={stats.wins}
              bg="bg-orange-500/10"
            />
          </div>
        </div>
      </div>

      {/* 2. Withdrawal Section (Conditional) */}
      {hasFunds && (
        <div className="bg-[#1b1c23] rounded-3xl p-6 text-white shadow-lg shadow-indigo-200/50 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Claimable Earnings
              </span>
              <div className="text-3xl font-black mt-1">
                {claimableAmount} USDC
              </div>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>
          <button
            onClick={() => withdraw()}
            disabled={isWithdrawing}
            className="w-full py-3.5 bg-white text-[#1b1c23] rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 relative z-10"
          >
            {isWithdrawing ? "Processing..." : "Withdraw to Wallet"}
          </button>
        </div>
      )}

      {/* 3. Primary Action */}
      <Button
        onClick={() => router.push("/create")}
        className="h-auto py-5 flex items-center justify-between px-6 rounded-[20px] bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-[#8c8fff] transition-all group"
        variant="ghost"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#1b1c23] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="text-left">
            <span className="block text-sm font-extrabold text-[#1b1c23]">
              Create New Dispute
            </span>
            <span className="text-[11px] font-medium text-gray-400">
              Start a case in General Court
            </span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
          <span className="text-xl leading-none mb-1 text-gray-400">›</span>
        </div>
      </Button>
    </div>
  );
};

const StatItem = ({ icon, label, value, bg }: any) => (
  <div className="flex flex-col items-center gap-1">
    <div
      className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center mb-1`}
    >
      {icon}
    </div>
    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
      {label}
    </span>
    <span className="text-base font-extrabold text-white">{value}</span>
  </div>
);
