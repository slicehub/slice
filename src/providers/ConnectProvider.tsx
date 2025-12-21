"use client";

import React, {
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useEffect,
} from "react";
import { Signer } from "ethers";
import { useEmbedded } from "./EmbeddedProvider";
import { useAccount, useWalletClient, useSwitchChain } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { walletClientToSigner } from "@/util/ethers-adapter";
import { defaultChain } from "@/config/chains";
import { useConnect } from "@/hooks/useConnect";

interface ContractsContextType {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  address: string | null;
  signer: Signer | null;
  isConnecting: boolean;
  isWrongNetwork: boolean;
}

const ContractsContext = createContext<ContractsContextType | null>(null);

export const ConnectProvider = ({ children }: { children: ReactNode }) => {
  const { isEmbedded } = useEmbedded();

  // --- STRATEGY 1: Embedded Wallet (via Hook) ---
  const xo = useConnect(isEmbedded);

  // --- STRATEGY 2: Standard Web Wallet (Wagmi/Privy) ---
  const {
    address: wagmiAddress,
    isConnected: isWagmiConnected,
    chain,
  } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { login, logout } = usePrivy();
  const { switchChain } = useSwitchChain();

  // --- DERIVED STATE (The Selector) ---

  // 1. Calculate Address (No useEffect syncing!)
  const address = isEmbedded
    ? xo.address
    : isWagmiConnected
      ? wagmiAddress || null
      : null;

  // 2. Calculate Signer
  const activeSigner = useMemo(() => {
    // If embedded, return embedded signer
    if (isEmbedded) return xo.signer;

    // If web, derive signer from walletClient immediately
    // We DO NOT check network here to avoid halting the app
    if (walletClient) {
      try {
        return walletClientToSigner(walletClient);
      } catch (e) {
        console.error("Signer conversion failed", e);
        return null;
      }
    }
    return null;
  }, [isEmbedded, xo.signer, walletClient]);

  // 3. Network Validation
  // We check if connected, not embedded, and chain ID mismatch
  // Use loose check (chain?.id) to handle 'undefined' chain from Wagmi
  const isWrongNetwork =
    !isEmbedded && isWagmiConnected && chain?.id !== defaultChain.id;

  // Auto-switch network effect (Non-blocking)
  useEffect(() => {
    if (isWrongNetwork && switchChain) {
      // Only log once per mismatch to avoid spam
      console.log(
        `[Network] Mismatch detected. Want ${defaultChain.id}, got ${chain?.id}. Switching...`,
      );
      switchChain({ chainId: defaultChain.id });
    }
  }, [isWrongNetwork, chain?.id, switchChain]);

  // 4. Unified Actions
  const connect = async () => {
    if (isEmbedded) await xo.connect();
    else login();
  };

  const disconnect = async () => {
    if (isEmbedded) await xo.disconnect();
    else await logout();
  };

  return (
    <ContractsContext.Provider
      value={{
        connect,
        disconnect,
        address: address as string | null,
        signer: activeSigner,
        isConnecting: isEmbedded ? xo.isConnecting : false,
        isWrongNetwork,
      }}
    >
      {children}
    </ContractsContext.Provider>
  );
};

export const useContracts = () => {
  const ctx = useContext(ContractsContext);
  if (!ctx)
    throw new Error("useContracts must be used within XOContractsProvider");
  return ctx;
};
