"use client";

import { useState, useEffect } from "react";
import { useBalance } from "wagmi";
import { Contract, formatUnits } from "ethers";
import { useEmbedded } from "@/providers/EmbeddedProvider";
import { useContracts } from "@/providers/ConnectProvider";
import { erc20Abi } from "@/contracts/erc20-abi";
import { toast } from "sonner";

import { defaultChain } from "@/config/chains"; // Import your default chain config

export function useTokenBalance(tokenAddress: string | undefined) {
  const { isEmbedded } = useEmbedded();
  const { address, signer } = useContracts();

  // --- 1. Standard Mode (Wagmi) ---
  const {
    data: wagmiData,
    isLoading: isWagmiLoading,
    error: wagmiError,
    refetch,
  } = useBalance({
    address: address as `0x${string}`,
    token: isEmbedded ? undefined : (tokenAddress as `0x${string}`),
    chainId: defaultChain.id, // <--- CRITICAL FIX: Force query on Base, not Ethereum
    query: {
      enabled: !isEmbedded && !!address && !!tokenAddress,
      retry: 2,
    },
  });

  // --- 2. Embedded Mode (Ethers.js) ---
  const [embeddedBalance, setEmbeddedBalance] = useState<string | null>(null);
  const [embeddedSymbol, setEmbeddedSymbol] = useState<string>("USDC");

  // Initialize to false to prevent "stuck" loading state when wallet isn't connected
  const [isEmbeddedLoading, setIsEmbeddedLoading] = useState(false);

  useEffect(() => {
    if (!isEmbedded) return;

    // Return early if wallet is not ready.
    // Since isEmbeddedLoading is false, this won't block the UI.
    if (!address || !signer) return;

    if (!tokenAddress) return;

    const fetchEmbeddedBalance = async () => {
      setIsEmbeddedLoading(true);
      try {
        console.log(
          `💰 Fetching balance for ${address} on token ${tokenAddress}`,
        );
        const contract = new Contract(tokenAddress, erc20Abi, signer);

        // Fetch balance, decimals, and symbol in parallel
        const [balance, decimals, symbol] = await Promise.all([
          contract.balanceOf(address),
          contract.decimals(),
          contract.symbol(),
        ]);

        // Format using the actual decimals from the contract
        setEmbeddedBalance(formatUnits(balance, decimals));
        setEmbeddedSymbol(symbol);
        console.log("💰 Raw balance result:", formatUnits(balance, decimals));
      } catch (error) {
        console.error("❌ Balance Fetch Failed:", error);
        console.error("Failed to fetch embedded balance", error);
        setEmbeddedBalance(null);
        // ADD THIS: Show detailed error in toast
        toast.error(
          `Balance Fetch Error: ${(error as any).reason || (error as any).message || error}`,
        );
      } finally {
        setIsEmbeddedLoading(false);
      }
    };

    fetchEmbeddedBalance();
  }, [isEmbedded, address, signer, tokenAddress]);

  // --- 3. Unified Return ---
  if (isEmbedded) {
    const isWaitingForWallet = !address || !signer;

    return {
      formatted: embeddedBalance,
      symbol: embeddedSymbol,
      // isLoading is true only if actively fetching OR waiting for wallet connection
      isLoading: isEmbeddedLoading || isWaitingForWallet,
      error: null,
      refetch: () => {
        // Optional: Trigger re-fetch logic here if needed
      },
    };
  }

  return {
    formatted: wagmiData?.formatted,
    symbol: wagmiData?.symbol,
    isLoading: isWagmiLoading,
    error: wagmiError,
    refetch,
  };
}
