export interface Balance {
  asset_type: string;
  balance: string;
}

export const fetchBalance = async (_address: string): Promise<Balance[]> => {
  return [{ asset_type: "native", balance: "100" }];
};

export const connectWallet = async () => {
  console.log("Mock connect wallet");
};

export const disconnectWallet = async () => {
  console.log("Mock disconnect wallet");
};

/**
 * Shortens a wallet address to the format 0x1234...5678
 * @param address The full wallet address (or any string)
 * @param chars Number of characters to show at start and end (default 4)
 * @returns Shortened address or original string if not a valid address format
 */
export const shortenAddress = (address: string | undefined, chars = 4): string => {
  if (!address) return "";

  // Basic check to see if it looks like an ETH address (0x followed by chars)
  // Logic: starts with 0x and is length 42.
  // Allow flexible length for testnet/other items but generally ensure it's long enough to need shortening.
  const isAddress = address.startsWith("0x") && address.length > 10;

  if (!isAddress) return address;

  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
};
