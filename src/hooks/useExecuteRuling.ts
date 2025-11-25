import { useState } from "react";
import { useWallet } from "./useWallet";
import { useNotification } from "./useNotification";
import { StellarContractService } from "../services/StellarContractService";

import slice from "../contracts/slice";

export function useExecuteRuling() {
  const { address, signTransaction } = useWallet();
  const { addNotification } = useNotification();
  const [isExecuting, setIsExecuting] = useState(false);

  const executeRuling = async (disputeId: string | number) => {
    if (!address || !signTransaction) {
      addNotification("Please connect your wallet", "error");
      return null;
    }

    setIsExecuting(true);

    try {
      slice.options.publicKey = address;

      const tx = await slice.execute({
        dispute_id: BigInt(disputeId),
      });

      const result = await tx.signAndSend({
        signTransaction: async (xdr) => {
          const { signedTxXdr } = await signTransaction(xdr);
          return { signedTxXdr };
        },
      });

      const txData = StellarContractService.extractTransactionData(result);

      if (txData.success) {
        // Returns the winner Address
        const winner = result.result?.unwrap();
        addNotification(`Ruling executed! Winner: ${winner}`, "success");
        return winner;
      } else {
        addNotification("Execution failed", "error");
        return null;
      }
    } catch (err) {
      console.error("Execution Error:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      addNotification(msg, "error");
      return null;
    } finally {
      setIsExecuting(false);
    }
  };

  return { executeRuling, isExecuting };
}
