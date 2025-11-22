/* eslint-disable react-x/no-use-context, react-x/no-context-provider */
import React, { createContext, useContext, useCallback, useState } from "react";
import { useWallet } from "../hooks/useWallet";
import {
  contractClient,
  StellarContractService,
} from "../services/StellarContractService";

interface PrizePoolContextType {
  balance: { stroops: string; xlm: string } | null;
  isLoading: boolean;
  loadPrizePot: () => Promise<void>;
}

const PrizePoolContext = createContext<PrizePoolContextType | undefined>(
  undefined,
);

// eslint-disable-next-line react-refresh/only-export-components
export const usePrizePool = () => {
  const context = useContext(PrizePoolContext);
  if (!context) {
    throw new Error("usePrizePool must be used within a PrizePoolProvider");
  }
  return context;
};

interface PrizePoolProviderProps {
  children: React.ReactNode;
}

export const PrizePoolProvider: React.FC<PrizePoolProviderProps> = ({
  children,
}) => {
  const { address } = useWallet();
  const [balance, setBalance] = useState<{
    stroops: string;
    xlm: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadPrizePot = useCallback(async () => {
    if (!address) {
      setBalance(null);
      return;
    }

    setIsLoading(true);

    try {
      contractClient.options.publicKey = address;
      const tx = await contractClient.prize_pot();
      const result = tx.result;

      if (result !== undefined && result !== null) {
        const stroops = result.toString();
        const xlm = StellarContractService.formatStroopsToXlm(stroops);
        setBalance({ stroops, xlm });
      } else {
        throw new Error("No result from prize_pot simulation");
      }
    } catch (error: unknown) {
      console.error("Failed to load prize pot:", error);
      setBalance({ stroops: "0", xlm: "0.0000000" });
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  return (
    <PrizePoolContext.Provider value={{ balance, isLoading, loadPrizePot }}>
      {children}
    </PrizePoolContext.Provider>
  );
};
