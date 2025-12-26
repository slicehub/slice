import { createConnector } from 'wagmi';
import { Chain } from 'wagmi/chains';

// Helper to convert Wagmi Chains to the Hex Map required by XO
function getRpcMap(chains: readonly Chain[]) {
    const rpcMap: Record<string, string> = {};
    chains.forEach((chain) => {
        const hexId = `0x${chain.id.toString(16)}`;
        // Use the first available HTTP RPC
        rpcMap[hexId] = chain.rpcUrls.default.http[0];
    });
    return rpcMap;
}

export function xoConnector() {
    let providerInstance: any = null;

    return createConnector((config) => ({
        id: 'xo-connect',
        name: 'XO Wallet',
        type: 'xo-connect',

        async connect({ chainId: _chainId } = {}): Promise<any> {
            const provider = await this.getProvider();

            // Trigger the handshake
            await (provider as any).request({ method: 'eth_requestAccounts' });

            const currentChainId = await this.getChainId();
            const accounts = await this.getAccounts();

            return {
                accounts: accounts as readonly `0x${string}`[],
                chainId: currentChainId,
            } as any;
        },

        async getProvider() {
            // Singleton pattern: Only create the provider once
            if (!providerInstance) {
                // Dynamically import the library here to prevent server-side crashes
                const mod = await import('xo-connect');
                const XOConnectProvider = mod.XOConnectProvider;

                const chains = config.chains;
                // Default to the first chain in your config, or the requested one
                const initialChain = chains[0];
                const initialHexId = `0x${initialChain.id.toString(16)}`;

                providerInstance = new XOConnectProvider({
                    rpcs: getRpcMap(chains),
                    defaultChainId: initialHexId,
                });
            }
            return providerInstance;
        },

        async getAccounts() {
            const provider = await this.getProvider();
            const accounts = await (provider as any).request({ method: 'eth_accounts' });
            return accounts as readonly `0x${string}`[];
        },

        async getChainId() {
            const provider = await this.getProvider();
            const hexId = await (provider as any).request({ method: 'eth_chainId' });
            return parseInt(hexId, 16);
        },

        async isAuthorized() {
            try {
                const accounts = await this.getAccounts();
                return !!accounts.length;
            } catch {
                return false;
            }
        },

        async disconnect() {
            // XOConnect handles disconnects internally via window events,
            // but we can ensure local state is cleared if needed.
        },

        onAccountsChanged(accounts) {
            config.emitter.emit('change', { accounts: accounts as readonly `0x${string}`[] });
        },

        onChainChanged(chain) {
            const chainId = parseInt(chain, 16);
            config.emitter.emit('change', { chainId });
        },

        onDisconnect() {
            config.emitter.emit('disconnect');
        },
    }));
}
