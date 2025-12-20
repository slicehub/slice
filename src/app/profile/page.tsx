"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Terminal,
  Bug,
  Coins,
  Wallet
} from "lucide-react";
import ConnectButton from "@/components/ConnectButton";
import { useSliceContract } from "@/hooks/useSliceContract";
import { useXOContracts } from "@/providers/XOContractsProvider";

export default function ProfilePage() {
  const router = useRouter();
  const contract = useSliceContract();
  const { address } = useXOContracts();

  // --- State ---
  const [stats, setStats] = useState({
    coherence: 100, // Mock default
    totalCases: 0,
    streak: 3       // Mock default
  });
  const [earnings, setEarnings] = useState("0");

  // --- Fetch Juror Stats ---
  useEffect(() => {
    const fetchStats = async () => {
      if (!contract || !address) return;
      try {
        // We only need the count of disputes now, not the full history
        const ids = await contract.getJurorDisputes(address);

        setStats(prev => ({
          ...prev,
          totalCases: ids.length,
          // In a real app, calculate coherence/streak from the dispute outcomes here
        }));

        setEarnings("1,240.50"); // Mock Value for Lifetime Earnings
      } catch (e) {
        console.error("Error fetching juror stats:", e);
      }
    };
    fetchStats();
  }, [contract, address]);

  // --- Dev Tools Logic ---
  const openConsole = () => window.dispatchEvent(new Event("open-debug-console"));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-[90px]">
      {/* --- Header --- */}
      <div className="w-full px-5 pt-9 pb-4 flex items-center justify-between bg-white shadow-sm z-10 sticky top-0">
        <button
          onClick={() => router.push("/disputes")}
          className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#1b1c23]" />
        </button>
        <span className="font-manrope font-extrabold text-lg text-[#1b1c23]">
          Juror Profile
        </span>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">

        {/* --- 1. Hero / Reputation Card --- */}
        <div className="bg-[#1b1c23] rounded-3xl p-6 shadow-lg text-white flex flex-col items-center gap-4 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#8c8fff] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative z-10">
            <div className="w-24 h-24 rounded-full border-4 border-[#8c8fff] p-1 shadow-xl">
              <img
                src="/images/profiles-mockup/profile-1.png"
                alt="Juror Avatar"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[#8c8fff] text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-[#1b1c23]">
              LVL 5
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 z-10">
            <h2 className="font-manrope font-extrabold text-xl">
              High Arbiter
            </h2>
            <div className="scale-90 opacity-90 hover:opacity-100 transition-opacity">
              <ConnectButton />
            </div>
          </div>

          {/* Gamification Stats */}
          <div className="grid grid-cols-3 divide-x divide-white/10 w-full mt-2 bg-white/5 rounded-2xl p-3 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Accuracy</span>
              <span className="text-sm font-bold text-[#4ade80]">{stats.coherence}%</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Cases</span>
              <span className="text-sm font-bold">{stats.totalCases}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Streak</span>
              <span className="text-sm font-bold text-[#8c8fff]">🔥 {stats.streak}</span>
            </div>
          </div>
        </div>

        {/* --- 2. Lifetime Earnings Section (Restored) --- */}
        <div className="flex flex-col gap-3">
          <h3 className="font-manrope font-bold text-gray-800 uppercase tracking-wider ml-1 text-xs flex items-center gap-2">
            <Wallet className="w-3.5 h-3.5" /> Rewards
          </h3>
          <div className="bg-white p-5 rounded-[20px] border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 font-bold uppercase">Lifetime Earnings</span>
              <div className="text-2xl font-extrabold text-[#1b1c23] mt-1">${earnings}</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
              <Coins className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* --- 3. Settings & Dev Tools (Collapsed) --- */}
        <div className="mt-2 pt-6 border-t border-gray-100">
          <h3 className="font-manrope font-bold text-gray-400 uppercase tracking-wider ml-1 text-[10px] mb-3">
            Settings & Tools
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push("/debug")}
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Bug className="w-4 h-4 text-[#8c8fff]" /> Debugger
            </button>
            <button
              onClick={openConsole}
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Terminal className="w-4 h-4 text-gray-500" /> Console
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}