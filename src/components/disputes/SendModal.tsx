"use client";

import React, { useState } from "react";
import { parseUnits, isAddress } from "ethers";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { erc20Abi } from "viem"; // or import from your local abi file
import { getContractsForChain } from "@/config/contracts";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SendModal: React.FC<SendModalProps> = ({ isOpen, onClose }) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  // Wagmi Hooks for writing to contract
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { chainId } = useAccount();

  // Watch for transaction completion
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Reset and close on success
  React.useEffect(() => {
    if (isConfirmed) {
      toast.success("Transfer successful!");
      onClose();
      setRecipient("");
      setAmount("");
    }
  }, [isConfirmed, onClose]);

  // Handle errors
  React.useEffect(() => {
    if (error) {
      toast.error(error.message || "Transaction failed");
    }
  }, [error]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAddress(recipient)) {
      toast.error("Invalid recipient address");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Invalid amount");
      return;
    }

    try {
      // USDC has 6 decimals
      const value = parseUnits(amount, 6);
      const { usdcToken } = getContractsForChain(chainId || 0);

      writeContract({
        address: usdcToken as `0x${string}`,
        abi: erc20Abi,
        functionName: "transfer",
        args: [recipient as `0x${string}`, value],
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to prepare transaction");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] w-full max-w-sm p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-extrabold text-[#1b1c23] font-manrope">
            Send USDC
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSend} className="flex flex-col gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Recipient Address
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full p-4 bg-[#f5f6f9] rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-[#8c8fff] transition-all"
              disabled={isPending || isConfirming}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Amount (USDC)
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-4 bg-[#f5f6f9] rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-[#8c8fff] transition-all"
              disabled={isPending || isConfirming}
            />
          </div>

          <button
            type="submit"
            disabled={isPending || isConfirming}
            className="w-full py-4 mt-2 bg-[#1b1c23] text-white rounded-xl font-bold hover:bg-[#2c2d33] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isPending ? "Check Wallet..." : "Confirming..."}
              </>
            ) : (
              "Confirm Send"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
