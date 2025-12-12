"use client";

import React, { useState } from "react";
import { useXOContracts } from "@/providers/XOContractsProvider";
import { settings } from "@/util/config"; // Import settings to get the Chain ID
import { toast } from "sonner";
import { X, Copy, Check } from "lucide-react";

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiveModal: React.FC<ReceiveModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { address } = useXOContracts();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !address) return null;

  // Append the Chain ID (e.g., @8453).
  // This tells the wallet specifically to look at Base, not Ethereum Mainnet.
  const chainId = settings.chain.chainId;
  const paymentUri = `ethereum:${address}@${chainId}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUri)}&bgcolor=ffffff`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Address copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] w-full max-w-sm p-6 shadow-xl relative animate-in zoom-in-95 duration-200 flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-6">
          <h2 className="text-xl font-extrabold text-[#1b1c23] font-manrope">
            Receive
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* QR Code Card */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-6">
          <div className="w-48 h-48 bg-[#f5f6f9] rounded-2xl overflow-hidden">
            <img
              src={qrCodeUrl}
              alt="Wallet QR Code"
              className="w-full h-full object-cover mix-blend-multiply"
            />
          </div>
        </div>

        {/* Address & Copy */}
        <div className="w-full space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
            Your Address
          </label>
          <button
            onClick={copyToClipboard}
            className="w-full p-4 bg-[#f5f6f9] hover:bg-gray-100 rounded-2xl flex items-center justify-between gap-3 group transition-colors text-left"
          >
            <span className="font-mono text-xs text-[#1b1c23] break-all leading-relaxed">
              {address}
            </span>
            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-105 transition-transform text-[#1b1c23]">
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </div>
          </button>
        </div>

        {/* Network Warning */}
        <div className="mt-6 p-3 bg-[#8c8fff]/10 border border-[#8c8fff]/20 rounded-xl flex gap-3 items-start">
          <div className="p-1 bg-[#8c8fff]/20 rounded-full shrink-0">
            <div className="w-1.5 h-1.5 bg-[#8c8fff] rounded-full" />
          </div>
          <p className="text-[11px] font-bold text-[#1b1c23] leading-tight">
            This QR code works on the{" "}
            <strong>{settings.chain.supportedChains[0].chainName}</strong>{" "}
            network (Chain ID: {chainId}).
          </p>
        </div>
      </div>
    </div>
  );
};
