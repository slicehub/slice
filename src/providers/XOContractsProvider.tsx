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
import { DEFAULT_CHAIN, defaultChain } from "@/config/chains";
import { useWalletClient, useAccount, useSwitchChain } from "wagmi";
import { walletClientToSigner } from "@/util/ethers-adapter";
import { toHex } from "viem";
import { usePrivy } from "@privy-io/react-auth";

interface Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

interface XOContractsContextType {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  address: string | null;
  signer: Signer | null;
  isConnecting: boolean;
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
  const initializationAttempted = useRef(false);

  // --- Web/Wagmi State ---
  const { address: wagmiAddress, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const { login, logout } = usePrivy();

  const activeChain = DEFAULT_CHAIN.chain;

  // 1. XO Connection Logic
  const connectXO = useCallback(
    async (silent = false) => {
      setIsConnecting(true);
      try {
        console.log("🚀 Starting XO Connection..."); // Added log
        console.log("📦 Importing xo-connect...");
        const { XOConnectProvider } = await import("xo-connect");

        const chainIdHex = toHex(activeChain.id);
        console.log(`🔗 Chain ID: ${activeChain.id} (${chainIdHex})`);
        console.log(`📡 RPC: ${activeChain.rpcUrls.default.http[0]}`);

        const provider: Provider = new XOConnectProvider({
          rpcs: {
            [chainIdHex]: activeChain.rpcUrls.default.http[0],
          },
          defaultChainId: chainIdHex,
        });

        console.log("🙏 Requesting accounts...");
        await provider.request({ method: "eth_requestAccounts" });

        console.log("🛠 Creating Ethers Provider...");
        const ethersProvider = new BrowserProvider(provider);

        console.log("✍️ Getting Signer...");
        const newSigner = await ethersProvider.getSigner();

        console.log("🆔 Getting Address...");
        const addr = await newSigner.getAddress();

        console.log(`✅ Success! Connected to ${addr}`);
        setXoSigner(newSigner);
        setXoAddress(addr);
        if (!silent) {
          toast.success(`Connected via XO`);
        }
      } catch (err: any) {
        // This will now show up in your Red Debug Overlay
        console.error("❌ XO Connection Failed Details:", {
          message: err.message,
          stack: err.stack,
          fullError: err
        });

        if (!silent) {
          toast.error(`Failed to connect XO: ${err.message}`);
        }
      } finally {
        setIsConnecting(false);
      }
    },
    [activeChain],
  );

  // 2. AUTO-CONNECT EFFECT (Embedded)
  useEffect(() => {
    if (isEmbedded && !xoAddress && !initializationAttempted.current) {
      initializationAttempted.current = true;
      connectXO(true);
    }
  }, [isEmbedded, xoAddress, connectXO]);

  // 3. Wagmi/Privy Logic (Web)
  useEffect(() => {
    if (!isEmbedded) {
      // 3a. Handle Address (Read-only UI) - Updates immediately
      if (isConnected && wagmiAddress) {
        setActiveAddress(wagmiAddress);
      } else {
        setActiveAddress(null);
        setActiveSigner(null); // Clear signer if disconnected
        return;
      }

      // 3b. Handle Signer (Write actions) - Updates when walletClient is ready
      if (isConnected && walletClient) {
        // Network Check
        if (chain?.id !== defaultChain.id) {
          console.warn(
            `[XOProvider] Wrong Network detected (${chain?.id}). Switching...`,
          );
          switchChain({ chainId: defaultChain.id });
          return;
        }

        try {
          const signer = walletClientToSigner(walletClient);
          setActiveSigner(signer);
        } catch (e) {
          console.error("[XOProvider] Error creating signer:", e);
          setActiveSigner(null);
        }
      }
    }
  }, [isEmbedded, isConnected, wagmiAddress, walletClient, chain, switchChain]);

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
      login();
    }
  };

  const disconnect = async () => {
    if (isEmbedded) {
      setXoAddress(null);
      setXoSigner(null);
    } else {
      await logout();
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
