"use client";

import React, {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { toast } from "sonner";
import { BrowserProvider, Signer } from "ethers";
import { useEmbedded } from "./EmbeddedProvider";
import { DEFAULT_CHAIN } from "@/config/chains";
import { useWalletClient, useDisconnect } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { walletClientToSigner } from "@/util/ethers-adapter";
import { toHex } from "viem";

interface Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

interface XOContractsContextType {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  address: string | null;
  signer: Signer | null;
  isConnecting: boolean; // Useful for UI loading states
}

const XOContractsContext = createContext<XOContractsContextType | null>(null);

export const XOContractsProvider = ({ children }: { children: ReactNode }) => {
  const { isEmbedded } = useEmbedded();

  // --- Global State ---
  const [activeAddress, setActiveAddress] = useState<string | null>(null);
  const [activeSigner, setActiveSigner] = useState<Signer | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // --- Embedded State (XO) ---
  const [xoAddress, setXoAddress] = useState<string | null>(null);
  const [xoSigner, setXoSigner] = useState<Signer | null>(null);
  const initializationAttempted = useRef(false); // Prevent double-run in Strict Mode

  // --- Web/Wagmi State ---
  const { data: walletClient } = useWalletClient();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { open } = useAppKit();

  const activeChain = DEFAULT_CHAIN.chain;

  // 1. XO Connection Logic
  // Added 'silent' parameter to suppress toasts on auto-connect
  const connectXO = useCallback(
    async (silent = false) => {
      setIsConnecting(true);
      try {
        const { XOConnectProvider } = await import("xo-connect");

        const chainIdHex = toHex(activeChain.id);
        const provider: Provider = new XOConnectProvider({
          rpcs: { [chainIdHex]: activeChain.rpcUrls.default.http[0] },
          defaultChainId: chainIdHex,
        });

        await provider.request({ method: "eth_requestAccounts" });

        const ethersProvider = new BrowserProvider(provider);
        const newSigner = await ethersProvider.getSigner();
        const addr = await newSigner.getAddress();

        setXoSigner(newSigner);
        setXoAddress(addr);

        if (!silent) {
          toast.success(`Connected via XO`);
        }
      } catch (err) {
        console.error("XO Connection Failed:", err);
        if (!silent) {
          toast.error("Failed to connect XO");
        }
      } finally {
        setIsConnecting(false);
      }
    },
    [activeChain],
  );

  // 2. AUTO-CONNECT EFFECT (The Fix)
  useEffect(() => {
    if (isEmbedded && !xoAddress && !initializationAttempted.current) {
      initializationAttempted.current = true;
      connectXO(true);
    }
  }, [isEmbedded, xoAddress, connectXO]);

  // 3. Wagmi/Reown Logic (Web)
  useEffect(() => {
    if (!isEmbedded && walletClient) {
      const signer = walletClientToSigner(walletClient);
      setActiveSigner(signer);
      setActiveAddress(walletClient.account.address);
    } else if (!isEmbedded && !walletClient) {
      setActiveSigner(null);
      setActiveAddress(null);
    }
  }, [walletClient, isEmbedded]);

  // 4. Sync Logic for Embedded
  useEffect(() => {
    if (isEmbedded) {
      setActiveSigner(xoSigner);
      setActiveAddress(xoAddress);
    }
  }, [xoSigner, xoAddress, isEmbedded]);

  // --- Public Interface ---
  const connect = async () => {
    if (isEmbedded) {
      await connectXO(false);
    } else {
      await open();
    }
  };

  const disconnect = async () => {
    if (isEmbedded) {
      setXoAddress(null);
      setXoSigner(null);
      // Optional: Reset initialization ref if you want to allow re-auto-connect logic
      // initializationAttempted.current = false;
    } else {
      wagmiDisconnect();
    }
  };

  return (
    <XOContractsContext.Provider
      value={{
        connect,
        disconnect,
        address: activeAddress,
        signer: activeSigner,
        isConnecting,
      }}
    >
      {children}
    </XOContractsContext.Provider>
  );
};

export const useXOContracts = () => {
  const ctx = useContext(XOContractsContext);
  if (!ctx)
    throw new Error("useXOContracts must be used within XOContractsProvider");
  return ctx;
};
