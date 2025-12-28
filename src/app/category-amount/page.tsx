"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AmountSelector } from "@/components/category-amount/AmountSelector";
import { SwipeButton } from "@/components/category-amount/SwipeButton";
import { AlertCircle, ChevronDown, ArrowLeft, Target } from "lucide-react";

export default function CategoryAmountPage() {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [category, setCategory] = useState("Select a category");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleBack = () => router.back();

  const handleSwipeComplete = () => {
    const ethValue = "0.00005";
    router.push(`/assign-dispute?amount=${ethValue}`);
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FC]">
      {/* 1. Simplified Header (Just the Back Button) */}
      <div className="px-6 pt-6 pb-2">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-[#1b1c23]" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center px-5 pb-8 gap-4 overflow-y-auto">
        {/* 2. Main Stake Card */}
        <div className="w-full bg-white rounded-[32px] p-6 shadow-[0px_8px_30px_rgba(0,0,0,0.04)] border border-white flex flex-col items-center justify-center text-center relative overflow-visible">
          {/* --- NEW: Category Selector (Inside the card) --- */}
          <div className="relative z-20 w-full mb-6">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-[#F5F6F9] hover:bg-[#EEF0F5] transition-colors rounded-full p-2 pr-4 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#8c8fff]">
                  {/* You can swap this icon based on selection */}
                  <Target className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm text-[#1b1c23]">
                  {category}
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95">
                {["General", "Tech & Software", "Freelance"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategory(cat);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-[#F5F6F9] text-sm font-bold text-gray-600 hover:text-[#1b1c23] transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ambient Background Glow */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

          <div className="relative z-10 w-full flex flex-col items-center">
            {/* Animation */}
            <div className="w-[100px] h-[100px] mb-4 relative">
              <div className="absolute inset-0 bg-[#8c8fff]/10 rounded-full blur-xl scale-90" />
              <video
                src="/animations/money.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain relative z-10 drop-shadow-sm"
              />
            </div>

            <h1 className="text-2xl font-extrabold text-[#1b1c23] mb-2 font-manrope tracking-tight">
              Choose your stake
            </h1>

            <p className="text-gray-400 text-sm font-medium mb-6 max-w-[260px] leading-relaxed">
              You&apos;ll be matched with disputes in the same reward range.
            </p>

            <div className="w-full">
              <AmountSelector
                selectedAmount={selectedAmount}
                onAmountChange={setSelectedAmount}
              />
            </div>
          </div>
        </div>

        {/* 3. Warning / Info Card */}
        <div className="bg-[#F5F6F9] rounded-[20px] p-4 flex items-start gap-3 border border-[#EAECEF]">
          <div className="shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[#8c8fff]">
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-bold text-gray-500 leading-[1.5] mt-0.5 text-left">
            <span className="text-[#1b1c23]">Heads up:</span> Once you start a
            dispute, funds will be locked in the contract until a ruling is
            executed.
          </p>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="px-5 pb-8 flex justify-center shrink-0 z-20">
        <SwipeButton onSwipeComplete={handleSwipeComplete}>
          <span className="font-bold">Find Disputes</span>
        </SwipeButton>
      </div>
    </div>
  );
}
