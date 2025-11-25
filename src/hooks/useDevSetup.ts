// src/hooks/useDevSetup.ts
import { useState } from "react";
import { useWallet } from "./useWallet";
import { useNotification } from "./useNotification";
import { StellarContractService } from "../services/StellarContractService";

import slice from "../contracts/slice";
import { Buffer } from "buffer";

export function useDevSetup() {
  const { address, signTransaction } = useWallet();
  const { addNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>("");

  const setupDemoDispute = async () => {
    if (!address || !signTransaction) {
      addNotification("Connect wallet first", "error");
      return;
    }

    setIsLoading(true);
    setStatus("Initializing...");

    try {
      // Common signer helper
      const getSigner = async (xdr: string) => {
        const { signedTxXdr } = await signTransaction(xdr);
        return { signedTxXdr };
      };

      slice.options.publicKey = address;

      // 1. Add Category (Ignore error if exists)
      try {
        setStatus("Step 1/4: Adding Category...");
        const tx = await slice.add_category({ name: "General" });
        await tx.signAndSend({ signTransaction: getSigner });
      } catch (e) {
        console.log("Category might already exist, continuing...");
      }

      // 2. Create Dispute (Self vs Self for demo)
      setStatus("Step 2/4: Creating Dispute...");
      const metaHash = Buffer.alloc(32, 1); // Dummy hash
      const limits = {
        pay_seconds: BigInt(3600),
        commit_seconds: BigInt(3600),
        reveal_seconds: BigInt(3600),
      };

      const createTx = await slice.create_dispute({
        claimer: address,
        defender: address,
        meta_hash: metaHash,
        min_amount: BigInt(100),
        max_amount: BigInt(10000),
        category: "General",
        allowed_jurors: undefined,
        jurors_required: 5,
        limits,
      });

      const createRes = await createTx.signAndSend({
        signTransaction: getSigner,
      });
      const createData =
        StellarContractService.extractTransactionData(createRes);

      if (!createData.success || !createRes.result) {
        throw new Error("Failed to create dispute");
      }

      const disputeId = createRes.result.unwrap();
      addNotification(`Dispute #${disputeId} Created!`, "success");

      // 3. Fund as Claimer
      setStatus("Step 3/4: Funding (Claimer)...");
      const pay1Tx = await slice.pay_dispute({
        caller: address,
        dispute_id: disputeId,
        amount: BigInt(500),
      });
      await pay1Tx.signAndSend({ signTransaction: getSigner });

      // 4. Fund as Defender
      setStatus("Step 4/4: Funding (Defender)...");
      const pay2Tx = await slice.pay_dispute({
        caller: address,
        dispute_id: disputeId,
        amount: BigInt(500),
      });
      await pay2Tx.signAndSend({ signTransaction: getSigner });

      addNotification(
        "Setup Complete! Dispute is ready for jurors.",
        "success",
      );
      setStatus("");
    } catch (err) {
      console.error(err);
      addNotification("Setup Failed. Check console.", "error");
      setStatus("Error");
    } finally {
      setIsLoading(false);
    }
  };

  return { setupDemoDispute, isLoading, status };
}
