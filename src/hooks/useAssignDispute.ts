import { useCallback, useState } from "react";
import { useWallet } from "./useWallet";
import { useNotification } from "./useNotification";
import { StellarContractService } from "../services/StellarContractService";
import slice from "../contracts/slice";

export function useAssignDispute() {
  const { address, signTransaction } = useWallet();
  const { addNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  const assignDispute = useCallback(
    async (category: string, stakeAmount: bigint) => {
      if (!address || !signTransaction) {
        addNotification("Please connect your wallet first", "error");
        return null;
      }

      setIsLoading(true);

      try {
        // Set the source account for the contract call
        slice.options.publicKey = address;

        // 1. Invoke the contract function
        // Function signature: assign_dispute(caller: Address, category: Symbol, stake_amount: i128)
        const tx = await slice.assign_dispute({
          caller: address,
          category: category,
          stake_amount: stakeAmount,
        });

        // 2. Sign and Send
        const result = await tx.signAndSend({
          signTransaction: async (xdr) => {
            const { signedTxXdr } = await signTransaction(xdr);
            return { signedTxXdr };
          },
        });

        // 3. Parse Result
        const txData = StellarContractService.extractTransactionData(result);

        if (txData.success) {
          // The contract returns a tuple (u64, Address) -> (dispute_id, juror_address)
          // We unwrap the ScVal result to get the native JS types
          const returnValue = result.result?.unwrap();

          addNotification(`Successfully assigned as juror!`, "success");
          return returnValue;
        } else {
          addNotification("Transaction failed during submission", "error");
          return null;
        }
      } catch (err) {
        console.error("Assign Dispute Error:", err);
        const message =
          err instanceof Error ? err.message : "An unknown error occurred";
        addNotification(message, "error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [address, signTransaction, addNotification],
  );

  return { assignDispute, isLoading };
}
