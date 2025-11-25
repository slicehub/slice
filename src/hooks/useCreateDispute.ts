import { useState } from "react";
import { useWallet } from "./useWallet";
import { useNotification } from "./useNotification";
import { StellarContractService } from "../services/StellarContractService";

import slice from "../contracts/slice";
import { Buffer } from "buffer";

export interface TimeLimits {
  pay_seconds: bigint;
  commit_seconds: bigint;
  reveal_seconds: bigint;
}

export function useCreateDispute() {
  const { address, signTransaction } = useWallet();
  const { addNotification } = useNotification();
  const [isCreating, setIsCreating] = useState(false);

  const createDispute = async (
    defenderAddress: string,
    category: string,
    amount: number, // Amount in XLM (will be converted to stroops if needed)
    metaHashHex: string, // 32-byte hex string (IPFS hash usually)
    jurorsRequired: number = 5,
  ) => {
    if (!address || !signTransaction) {
      addNotification("Please connect your wallet", "error");
      return null;
    }

    setIsCreating(true);

    try {
      slice.options.publicKey = address;

      // Convert amount (assuming 1:1 logic or stroops based on your utils)
      // Assuming contract uses direct integers for now

      // Convert Hex string to Buffer for BytesN<32>
      const metaHashBuffer = Buffer.from(metaHashHex.replace("0x", ""), "hex");

      // Default time limits (could be passed as args)
      const limits: TimeLimits = {
        pay_seconds: BigInt(3600), // 1 hour to pay
        commit_seconds: BigInt(3600), // 1 hour to vote
        reveal_seconds: BigInt(3600), // 1 hour to reveal
      };

      const tx = await slice.create_dispute({
        claimer: address,
        defender: defenderAddress,
        meta_hash: metaHashBuffer,
        min_amount: BigInt(100), // Hardcoded limits for MVP
        max_amount: BigInt(10000),
        category: category,
        allowed_jurors: undefined, // None = public
        jurors_required: jurorsRequired,
        limits: limits,
      });

      const result = await tx.signAndSend({
        signTransaction: async (xdr) => {
          const { signedTxXdr } = await signTransaction(xdr);
          return { signedTxXdr };
        },
      });

      const txData = StellarContractService.extractTransactionData(result);

      if (txData.success) {
        // The contract returns the new Dispute ID (u64)
        const newDisputeId = result.result?.unwrap();
        addNotification(`Dispute #${newDisputeId} created!`, "success");
        return newDisputeId;
      } else {
        addNotification("Failed to create dispute", "error");
        return null;
      }
    } catch (err) {
      console.error("Create Dispute Error:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      addNotification(msg, "error");
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return { createDispute, isCreating };
}
