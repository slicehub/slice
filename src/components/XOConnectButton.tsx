"use client";

import React, { useState } from "react";
import { useXOContracts } from "@/providers/XOContractsProvider";
import { toast } from "sonner";
import { Loader2, Copy, Check, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button"; // Now importing the component

const XOConnectButton = () => {
  const { connect, address } = useXOContracts();
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await connect();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  // 1. Connected State
  if (address) {
    return (
      <div className="relative group inline-block">
        {/* Trigger Button */}
        <Button variant="outline" className="gap-2 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono">{shortAddress}</span>
        </Button>

        {/* Hover Card / Popover */}
        <div className="absolute right-0 top-full mt-2 w-72 p-4 rounded-xl border bg-popover text-popover-foreground shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 translate-y-2 group-hover:translate-y-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold leading-none tracking-tight text-sm">
                Wallet Connected
              </h4>
              <span className="text-[10px] uppercase bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">
                Active
              </span>
            </div>

            <div className="text-xs text-muted-foreground bg-muted p-2.5 rounded-md break-all font-mono border border-border/50">
              {address}
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="mr-2 h-3.5 w-3.5" />
                ) : (
                  <Copy className="mr-2 h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy Address"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Disconnected State
  return (
    <Button onClick={handleConnect} disabled={isLoading} className="shadow-md">
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="mr-2 h-4 w-4" />
          Login
        </>
      )}
    </Button>
  );
};

export default XOConnectButton;
