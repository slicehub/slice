"use client";
import React, { useState } from "react";
import { useSliceConnect } from "@/hooks/useSliceConnect";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { Loader2, Copy, Check, Wallet, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEmbedded } from "@/hooks/useEmbedded";

const ConnectButton = () => {
  const { isEmbedded } = useEmbedded();
  const { connect, disconnect } = useSliceConnect();
  const { address, status } = useAccount();
  const isConnecting = status === "connecting" || status === "reconnecting";

  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleConnect = async () => {
    try {
      // Call connect(). The hook decides the strategy.
      await connect();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setIsOpen(false);
      toast.success("Disconnected");
    } catch (e) {
      console.error("Disconnect failed:", e);
    }
  };

  const copyToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Address copied");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortAddress = address
    ? `${address.slice(0, 5)}...${address.slice(-4)}`
    : "";

  if (address) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-11 gap-3 rounded-2xl border-gray-200 bg-white px-5 text-[#1b1c23] shadow-sm transition-all duration-200 hover:bg-gray-50 hover:text-[#1b1c23] hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8c8fff] opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#8c8fff]"></span>
            </div>
            <span className="font-manrope font-bold tracking-tight">
              {shortAddress}
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-72 rounded-2xl border-gray-100 p-0 shadow-xl"
        >
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-manrope font-bold text-[#1b1c23] flex items-center gap-2">
                <User size={16} /> Account
              </h4>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-[#8c8fff]">
                {isEmbedded ? "Embedded" : "Connected"}
              </span>
            </div>

            <div className="break-all rounded-xl border border-gray-100 bg-gray-50 p-3 font-mono text-xs text-gray-600">
              {address}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="h-9 w-full justify-center rounded-xl bg-[#1b1c23] text-white hover:bg-[#2c2d33]"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-3.5 w-3.5" /> Copy Address
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-full justify-center rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600"
                onClick={handleDisconnect}
              >
                <LogOut className="mr-2 h-3.5 w-3.5" /> Disconnect
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className="h-11 rounded-2xl bg-[#1b1c23] px-6 text-base font-bold text-white shadow-lg hover:bg-[#2c2d33]"
    >
      {isConnecting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...
        </>
      ) : (
        <>
          <Wallet className="mr-2 h-4 w-4" /> Login
        </>
      )}
    </Button>
  );
};

export default ConnectButton;
