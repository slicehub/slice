import { useState } from "react";
import { useWallet } from "./useWallet";
import { useNotification } from "./useNotification";
import { StellarContractService } from "../services/StellarContractService";

import slice from "../contracts/slice";

export function usePayDispute() {
  const { address, signTransaction } = useWallet();
  const { addNotification } = useNotification();
  const [isPaying, setIsPaying] = useState(false);

  const payDispute = async (disputeId: string | number, amount: number) => {
    if (!address || !signTransaction) {
      addNotification("Please connect your wallet", "error");
      return false;
    }

    setIsPaying(true);

    try {
      slice.options.publicKey = address;

      const tx = await slice.pay_dispute({
        caller: address,
        dispute_id: BigInt(disputeId),
        amount: BigInt(amount),
      });

      const result = await tx.signAndSend({
        signTransaction: async (xdr) => {
          const { signedTxXdr } = await signTransaction(xdr);
          return { signedTxXdr };
        },
      });

      const txData = StellarContractService.extractTransactionData(result);

      if (txData.success) {
        addNotification("Payment successful! Funds locked.", "success");
        return true;
      } else {
        addNotification("Payment failed", "error");
        return false;
      }
    } catch (err) {
      console.error("Pay Dispute Error:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      addNotification(msg, "error");
      return false;
    } finally {
      setIsPaying(false);
    }
  };

  return { payDispute, isPaying };
}
