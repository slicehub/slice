"use client";

import React from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { Droplets, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useStakingToken } from "@/hooks/useStakingToken"; // Reuse your existing hook

const MINT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const FaucetButton = () => {
  const { address } = useAccount();
  const {
    address: tokenAddress,
    decimals,
    isLoading: isTokenLoading,
  } = useStakingToken();
  const { writeContractAsync, isPending } = useWriteContract();

  const handleMint = async () => {
    if (!address || !tokenAddress) return;

    try {
      await writeContractAsync({
        address: tokenAddress,
        abi: MINT_ABI,
        functionName: "mint",
        args: [address, parseUnits("50", decimals)], // Mint 1000 tokens
      });
      toast.success("Minting 50 USDC...");
    } catch (error) {
      console.error("Mint failed", error);
      toast.error("Failed to mint tokens");
    }
  };

  if (isTokenLoading || !tokenAddress) return null;

  return (
    <button
      onClick={handleMint}
      disabled={isPending}
      title="Get Test Tokens"
      className="bg-indigo-100 text-indigo-600 border-none rounded-[12.5px] px-3 h-7 flex items-center justify-center cursor-pointer hover:bg-indigo-200 transition-colors disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Droplets className="w-3.5 h-3.5" />
      )}
    </button>
  );
};
