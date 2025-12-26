import { useAccount, useChainId, useWalletClient } from "wagmi";
import { useEmbedded } from "@/providers/EmbeddedProvider";
import { DEFAULT_CHAIN } from "@/config/chains";
import { walletClientToSigner } from "@/util/ethers-adapter";
import { useMemo } from "react";

export function useSmartWallet() {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const { data: walletClient } = useWalletClient();
    const { isEmbedded } = useEmbedded();

    const signer = useMemo(() => {
        if (!walletClient) return null;

        // This is now safe; it returns null instead of throwing if data is missing
        return walletClientToSigner(walletClient);
    }, [walletClient]);

    return {
        address,
        signer,
        chainId,
        isConnected,
        isWrongNetwork: chainId !== DEFAULT_CHAIN.chain.id,
        isEmbedded
    };
}
