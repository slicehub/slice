"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CategoryAmountHeader } from "@/components/category-amount/CategoryAmountHeader";
import { AmountSelector } from "@/components/category-amount/AmountSelector";
import { InfoCard } from "@/components/category-amount/InfoCard";
import { SwipeButton } from "@/components/category-amount/SwipeButton";

export default function CategoryAmountPage() {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = React.useState<number>(20);

  const handleBack = () => router.back();

  const handleSwipeComplete = () => {
    // Redirect to the Matchmaker page with the selected amount
    // Using a small fixed ETH amount for testing
    const ethValue = "0.00005";
    router.push(`/assign-dispute?amount=${ethValue}`);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 p-4">
      <CategoryAmountHeader onBack={handleBack} />

      <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center text-center mb-4">
        <div className="w-24 h-24 mb-4">
          <video
            src="/animations/money.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold mb-2">Select amount of money</h1>
        <p className="text-gray-500 text-sm mb-6">
          You&apos;ll play with users with a monetary range selection like yours
        </p>
        <AmountSelector
          selectedAmount={selectedAmount}
          onAmountChange={setSelectedAmount}
        />
      </div>

      <InfoCard />

      <div className="mt-auto flex justify-center pb-8">
        <SwipeButton onSwipeComplete={handleSwipeComplete}>
          Swipe to find disputes
        </SwipeButton>
      </div>
    </div>
  );
}
