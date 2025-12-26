import { useChainId } from "wagmi";
import { useConnect } from "@/providers/ConnectProvider";
import { useEmbedded } from "@/providers/EmbeddedProvider";
import { DEFAULT_CHAIN } from "@/config/chains";

export function useSmartWallet() {
    const { isEmbedded } = useEmbedded();
    const { address, signer } = useConnect(); // This already handles getting the signer for both!

    // 1. Abstract Chain ID logic
    // Wagmi's hook doesn't work in embedded mode (or returns unexpected values), so we normalize it here.
    const wagmiChainId = useChainId();
    const chainId = isEmbedded ? DEFAULT_CHAIN.chain.id : wagmiChainId;

    // 2. Return a unified interface
    return {
        address,
        signer,
        chainId,
        isConnected: !!address && !!signer,
        // Helper to verify network (optional)
        isWrongNetwork: chainId !== DEFAULT_CHAIN.chain.id,
        // Re-export isEmbedded just in case, but usually not needed for logic anymore
        isEmbedded
    };
}
