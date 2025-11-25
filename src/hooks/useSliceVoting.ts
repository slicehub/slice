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

  // Helper to generate random salt
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

  // Helper to construct the commitment hash
  const calculateCommitment = (vote: number, salt: string) => {
    const voteBytes = new Uint8Array(4);
    new DataView(voteBytes.buffer).setUint32(0, vote, false); // Big Endian

    const saltHex = salt.replace(/^0x/, "");
    const saltRaw = Buffer.from(saltHex, "hex");
    const saltBuf32 = Buffer.alloc(32);
    saltRaw.copy(saltBuf32, 32 - saltRaw.length);

    const preimage = new Uint8Array(36);
    preimage.set(voteBytes, 0);
    preimage.set(saltBuf32, 4);

    const commitmentBuf32 = Buffer.alloc(32);
    Buffer.from(sha256(preimage)).copy(commitmentBuf32);

    return { commitmentBuf32, saltBuf32 };
  };

  // PHASE 1: COMMIT VOTE
  const commitVote = useCallback(
    async (disputeId: string, vote: number) => {
      if (!address || !signTransaction) throw new Error("Wallet not connected");

      setIsProcessing(true);
      setLogs("Generating secure commitment...");

      try {
        const salt = generateSalt();
        const { commitmentBuf32 } = calculateCommitment(vote, salt);

        slice.options.publicKey = address;

        // Save secrets to LocalStorage so user can reveal later
        const storageKey = `slice_vote_${disputeId}_${address}`;
        localStorage.setItem(storageKey, JSON.stringify({ vote, salt }));

        setLogs((prev) => prev + "\nSubmitting Commit transaction...");

        const commitTx = await slice.commit_vote({
          caller: address,
          dispute_id: BigInt(disputeId),
          commitment: commitmentBuf32,
        });

        const walletSigner = async (xdr: string) => {
          const signed = await signTransaction(xdr);
          return { signedTxXdr: signed.signedTxXdr, signerAddress: address };
        };

        const commitRes = await commitTx.signAndSend({ signTransaction: walletSigner });
        const commitData = StellarContractService.extractTransactionData(commitRes);

        if (!commitData.success) throw new Error("Commit transaction failed");

        setLogs((prev) => prev + "\n✓ Vote Committed! Please wait for other jurors before revealing.");
        return true;
      } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : String(err);
        setLogs((prev) => prev + `\n❌ Error: ${msg}`);
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [address, signTransaction, generateSalt]
  );

  // PHASE 2: REVEAL VOTE
  const revealVote = useCallback(
    async (disputeId: string) => {
      if (!address || !signTransaction) throw new Error("Wallet not connected");

      setIsProcessing(true);
      setLogs("Retrieving secret vote data...");

      try {
        // Retrieve secrets
        const storageKey = `slice_vote_${disputeId}_${address}`;
        const storedData = localStorage.getItem(storageKey);

        if (!storedData) throw new Error("No local vote data found for this dispute.");
        const { vote, salt } = JSON.parse(storedData);

        const { saltBuf32 } = calculateCommitment(vote, salt);

        slice.options.publicKey = address;

        // Generate ZK Proof (Required for v2, used as passed-through args here)
        setLogs((prev) => prev + "\nGenerating ZK Proof...");
        const revealProof = await noirService.current.generateProof("reveal", { vote });

        const vkJsonBuffer = StellarContractService.toBuffer(revealProof.vkJson);
        const proofBlobBuffer = StellarContractService.toBuffer(revealProof.proofBlob);

        setLogs((prev) => prev + "\nSubmitting Reveal transaction...");

        const revealTx = await slice.reveal_vote({
          caller: address,
          dispute_id: BigInt(disputeId),
          vote: vote,
          salt: saltBuf32,
          vk_json: vkJsonBuffer,
          proof_blob: proofBlobBuffer,
        });

        const walletSigner = async (xdr: string) => {
          const signed = await signTransaction(xdr);
          return { signedTxXdr: signed.signedTxXdr, signerAddress: address };
        };

        const revealRes = await revealTx.signAndSend({ signTransaction: walletSigner });
        const revealData = StellarContractService.extractTransactionData(revealRes);

        if (!revealData.success) throw new Error("Reveal transaction failed");

        setLogs((prev) => prev + "\n✓ Vote successfully revealed!");
        return true;
      } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : String(err);
        setLogs((prev) => prev + `\n❌ Error: ${msg}`);
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [address, signTransaction]
  );

  return { commitVote, revealVote, isProcessing, logs };
};
