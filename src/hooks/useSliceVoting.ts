import { useState, useRef, useCallback } from "react";
import { Buffer } from "buffer";
import { sha256 } from "@noble/hashes/sha2.js";
import { useWallet } from "./useWallet";
import { NoirService } from "../services/NoirService";
import { StellarContractService } from "../services/StellarContractService";
import slice from "../contracts/slice";

export const useSliceVoting = () => {
  const { address, signTransaction } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string>("");
  const noirService = useRef(new NoirService());

  const generateSalt = useCallback(() => {
    const array = new Uint8Array(31);
    crypto.getRandomValues(array);
    return (
      "0x" +
      Array.from(array)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
  }, []);

  const submitVote = useCallback(
    async (disputeId: string, vote: number, salt: string) => {
      if (!address || !signTransaction) throw new Error("Wallet not connected");

      setIsProcessing(true);
      setLogs("Computing SHA256 commitment...");

      try {
        slice.options.publicKey = address;

        // 1. Compute Commitment = SHA256(vote || salt)
        const voteBytes = new Uint8Array(4);
        new DataView(voteBytes.buffer).setUint32(0, vote, false);

        const saltHex = salt.replace(/^0x/, "");
        const saltRaw = Buffer.from(saltHex, "hex");
        const saltBuf32 = Buffer.alloc(32);
        saltRaw.copy(saltBuf32, 32 - saltRaw.length);

        const preimage = new Uint8Array(36);
        preimage.set(voteBytes, 0);
        preimage.set(saltBuf32, 4);

        const commitmentBuf32 = Buffer.alloc(32);
        Buffer.from(sha256(preimage)).copy(commitmentBuf32);

        // Helper for signing
        const walletSigner = async (xdr: string) => {
          const signed = await signTransaction(xdr);
          return {
            signedTxXdr: signed.signedTxXdr,
            signerAddress: signed.signerAddress ?? address,
          };
        };

        // 2. Commit Vote On-Chain
        setLogs((prev) => prev + "\nSubmitting Commit transaction...");
        const commitTx = await slice.commit_vote({
          caller: address,
          dispute_id: BigInt(disputeId),
          commitment: commitmentBuf32,
        });

        const commitRes = await commitTx.signAndSend({
          signTransaction: walletSigner,
        });
        const commitData =
          StellarContractService.extractTransactionData(commitRes);
        if (!commitData.success) throw new Error("Commit transaction failed");

        // 3. Generate ZK Proof
        setLogs((prev) => prev + "\nGenerating ZK Proof (Reveal)...");
        const revealProof = await noirService.current.generateProof("reveal", {
          vote,
        });

        const vkJsonBuffer = StellarContractService.toBuffer(
          revealProof.vkJson,
        );
        const proofBlobBuffer = StellarContractService.toBuffer(
          revealProof.proofBlob,
        );

        // 4. Reveal Vote On-Chain
        setLogs((prev) => prev + "\nSubmitting Reveal transaction...");
        const revealTx = await slice.reveal_vote({
          caller: address,
          dispute_id: BigInt(disputeId),
          vote: vote,
          salt: saltBuf32,
          vk_json: vkJsonBuffer,
          proof_blob: proofBlobBuffer,
        });

        const revealRes = await revealTx.signAndSend({
          signTransaction: walletSigner,
        });
        const revealData =
          StellarContractService.extractTransactionData(revealRes);
        if (!revealData.success) throw new Error("Reveal transaction failed");

        setLogs((prev) => prev + "\n✓ Vote successfully revealed!");
      } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setLogs((prev) => prev + `\n❌ Error: ${errorMessage}`);
      } finally {
        setIsProcessing(false);
      }
    },
    [address, signTransaction],
  );

  return { submitVote, generateSalt, isProcessing, logs, setLogs };
};
