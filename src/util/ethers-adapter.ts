import { BrowserProvider, JsonRpcSigner } from "ethers";
import { type WalletClient } from "viem";

/**
 * Converts a Viem Wallet Client (from Wagmi) to an Ethers.js Signer.
 */
export function walletClientToSigner(walletClient: WalletClient) {
  const { account, chain, transport } = walletClient;
  // FAIL SAFE: Return null instead of throwing error
  if (!account || !chain || !transport) {
    // console.warn("WalletClient incomplete, waiting for connection data...");
    return null;
  }

  const network = {
    chainId: chain?.id,
    name: chain?.name,
    ensAddress: chain?.contracts?.ensRegistry?.address,
  };

  // Create a BrowserProvider using the Viem transport
  const provider = new BrowserProvider(transport, network);

  // Create a Signer from the provider
  const signer = new JsonRpcSigner(provider, account.address);

  return signer;
}
