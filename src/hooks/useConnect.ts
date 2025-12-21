import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { BrowserProvider, Signer } from "ethers";
import { toHex } from "viem";
import { DEFAULT_CHAIN } from "@/config/chains";

export function useConnect(enabled: boolean) {
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const initialized = useRef(false);

  const activeChain = DEFAULT_CHAIN.chain;

  const connect = useCallback(
    async (silent = false) => {
      // Logic fix: use the dependency array for isConnecting
      if (isConnecting) return;
      setIsConnecting(true);

      try {
        // Dynamic import to avoid SSR issues
        const { XOConnectProvider } = await import("xo-connect");

        const chainIdHex = toHex(activeChain.id);

        // Initialize XO Provider
        const provider = new XOConnectProvider({
          rpcs: { [chainIdHex]: activeChain.rpcUrls.default.http[0] },
          defaultChainId: chainIdHex,
        });

        // Request Account
        await provider.request({ method: "eth_requestAccounts" });

        // Force Chain Switch (Best effort)
        try {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: chainIdHex }],
          });
        } catch (e) {
          console.warn("XO Chain switch warning:", e);
        }

        // Ethers Adapter
        const ethersProvider = new BrowserProvider(provider as any, "any");
        const newSigner = await ethersProvider.getSigner();
        const newAddress = await newSigner.getAddress();

        setSigner(newSigner);
        setAddress(newAddress);

        if (!silent) toast.success("Connected successfully");
      } catch (err: any) {
        console.error("Connection Error:", err);
        if (!silent) toast.error(`Connection Failed: ${err.message}`);
      } finally {
        setIsConnecting(false);
      }
    },
    // Added 'isConnecting' to the dependency array to satisfy exhaustive-deps
    [activeChain, isConnecting],
  );

  const disconnect = useCallback(async () => {
    setAddress(null);
    setSigner(null);
    initialized.current = false;
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (enabled && !address && !initialized.current) {
      initialized.current = true;
      connect(true);
    }
  }, [enabled, address, connect]);

  return {
    address,
    signer,
    connect,
    disconnect,
    isConnecting,
  };
}
