import { useState, useEffect, useCallback } from "react";
import { Contract, formatUnits } from "ethers";
import { useSmartWallet } from "@/hooks/useSmartWallet";
import { erc20Abi } from "@/contracts/erc20-abi";

export function useTokenBalance(tokenAddress: string | undefined) {
  const { address, signer } = useSmartWallet();
  const [formatted, setFormatted] = useState<string | null>(null);
  const [symbol, setSymbol] = useState("USDC");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!address || !signer || !tokenAddress) return;

    setIsLoading(true);
    setError(null); // Clear any previous errors
    try {
      // Ethers.js works for both standard wallets AND embedded signers
      const contract = new Contract(tokenAddress, erc20Abi, signer);
      const [bal, dec, sym] = await Promise.all([
        contract.balanceOf(address),
        contract.decimals(),
        contract.symbol()
      ]);
      setFormatted(formatUnits(bal, dec));
      setSymbol(sym);
    } catch (e) {
      console.error("Balance fetch error", e);
      setFormatted(null);
      setError(e as Error); // Set the error state
    } finally {
      setIsLoading(false);
    }
  }, [address, signer, tokenAddress]);

  useEffect(() => {
    void fetchBalance();
  }, [fetchBalance]);

  return { formatted, symbol, isLoading, error, refetch: fetchBalance };
}
