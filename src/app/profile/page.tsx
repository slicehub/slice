"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Terminal, Bug, Trophy, Flame, Target } from "lucide-react";
import ConnectButton from "@/components/ConnectButton";
import { useSliceContract } from "@/hooks/useSliceContract";
import { useConnect } from "@/providers/ConnectProvider";

export default function ProfilePage() {
  const router = useRouter();
  const contract = useSliceContract();
  const { address } = useConnect();

  // --- State ---
  const [stats, setStats] = useState({
    coherence: 100,
    totalCases: 0,
    streak: 3,
  });
  const [earnings, setEarnings] = useState("0");

  useEffect(() => {
    const fetchStats = async () => {
      if (!contract || !address) return;
      try {
        const ids = await contract.getJurorDisputes(address);
        setStats((prev) => ({
          ...prev,
          totalCases: ids.length,
        }));
        setEarnings("1,240.50");
      } catch (e) {
        console.error("Error fetching juror stats:", e);
      }
    };
    fetchStats();
  }, [contract, address]);

  const openConsole = () =>
    window.dispatchEvent(new Event("open-debug-console"));

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FC] pb-32">
      {/* --- Header --- */}
      <div className="w-full px-6 pt-10 pb-4 flex items-center justify-between sticky top-0 bg-[#F8F9FC]/80 backdrop-blur-md z-20">
        <button
          onClick={() => router.push("/disputes")}
          className="w-10 h-10 rounded-xl bg-white flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm border border-gray-100 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-[#1b1c23]" />
        </button>
        <span className="font-manrope font-extrabold text-lg text-[#1b1c23]">
          My Profile
        </span>
        <div className="w-10" />
      </div>

      <div className="flex-1 px-6 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* --- 1. Hero Card --- */}
        <div className="relative w-full rounded-[32px] p-1 bg-gradient-to-b from-gray-100 to-white shadow-xl shadow-gray-200/50">
          <div className="bg-[#1b1c23] rounded-[30px] p-6 pb-8 text-white flex flex-col items-center gap-6 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#8c8fff] opacity-10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500 opacity-5 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

            {/* Avatar Section */}
            <div className="relative z-10 mt-2">
              <div className="w-28 h-28 rounded-full p-[4px] bg-gradient-to-br from-[#8c8fff] to-blue-500 shadow-2xl relative">
                <div className="w-full h-full rounded-full border-[3px] border-[#1b1c23] overflow-hidden bg-[#2c2d33]">
                  <img
                    src="/images/profiles-mockup/profile-1.jpg"
                    alt="Juror Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Level Badge */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#8c8fff] to-[#7a7de0] text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-lg border-[3px] border-[#1b1c23] z-20 whitespace-nowrap">
                  LVL 5 JUROR
                </div>
              </div>
            </div>

            {/* Name & Address */}
            <div className="flex flex-col items-center gap-3 z-10 w-full">
              <h2 className="font-manrope font-black text-2xl tracking-tight">
                High Arbiter
              </h2>
              {/* Connect Button Wrapper to look like a pill */}
              <div className="scale-95 hover:scale-100 transition-transform duration-200">
                <ConnectButton />
              </div>
            </div>

            {/* Glassmorphic Stats Grid */}
            <div className="grid grid-cols-3 divide-x divide-white/10 w-full bg-white/5 border border-white/5 rounded-2xl py-4 backdrop-blur-sm mt-2">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mb-1">
                  <Target className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                  Accuracy
                </span>
                <span className="text-base font-extrabold text-white">
                  {stats.coherence}%
                </span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mb-1">
                  <Trophy className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                  Cases
                </span>
                <span className="text-base font-extrabold text-white">
                  {stats.totalCases}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center mb-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                </div>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                  Streak
                </span>
                <span className="text-base font-extrabold text-white">
                  {stats.streak}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- 2. Rewards Section --- */}
        <div className="flex flex-col gap-4">
          <h3 className="font-manrope font-extrabold text-gray-800 uppercase tracking-wide ml-1">
            Performance & Rewards
          </h3>
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between group transition-all hover:shadow-md">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Lifetime Earnings
              </span>
              <div className="text-3xl font-black text-gray-800 tracking-tight">
                ${earnings}
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-[#eff0ff] flex items-center justify-center text-[#8c8fff] group-hover:scale-110 transition-transform duration-300">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="8" r="6" />
                <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
                <path d="M7 6h1v4" />
                <path d="M17.12 12.23A6 6 0 0 1 5 8.77" strokeOpacity="0" />
              </svg>
            </div>
          </div>
        </div>

        {/* --- 3. Settings & Tools --- */}
        <div className="flex flex-col gap-3">
          <h3 className="font-manrope font-extrabold text-gray-800 uppercase tracking-wide ml-1">
            System &amp; Tools
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push("/debug")}
              className="flex items-center justify-center gap-2 p-3 bg-white rounded-xl border border-gray-100 shadow-sm text-xs font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
            >
              <Bug className="w-4 h-4 text-[#8c8fff]" />
              <span>Debugger</span>
            </button>

            <button
              onClick={openConsole}
              className="flex items-center justify-center gap-2 p-3 bg-white rounded-xl border border-gray-100 shadow-sm text-xs font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
            >
              <Terminal className="w-4 h-4 text-gray-500" />
              <span>Console</span>
            </button>
          </div>
        </div>

        {/* Version Info */}
        <div className="text-center mt-4">
          <span className="text-[12px] font-bold text-gray-400">
            Slice v1.0.2{" "}
          </span>
        </div>
      </div>
    </div>
  );
}
