"use client";

import React, { useState, useRef, useEffect } from "react";
import { useXOContracts } from "@/providers/XOContractsProvider";
import { useEmbedded } from "@/providers/EmbeddedProvider";
import { toast } from "sonner";
import { Loader2, Copy, Check, Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppKit } from "@reown/appkit/react";

const XOConnectButton = () => {
  const { isEmbedded } = useEmbedded();
  const { connect, disconnect, address } = useXOContracts();
  const { open } = useAppKit();

  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Add state to manually toggle dropdown (essential for touch/embedded)
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      if (isEmbedded) {
        await connect();
      } else {
        await open();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountClick = async () => {
    if (isEmbedded) {
      // Toggle custom dropdown for embedded users
      setShowDropdown(!showDropdown);
    } else {
      // Open AppKit modal for web users
      await open();
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setShowDropdown(false);
  };

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortAddress = address
    ? `${address.slice(0, 5)}...${address.slice(-4)}`
    : "";

  if (address) {
    return (
      <div className="flex items-center gap-3" ref={dropdownRef}>
        <div className="relative inline-block">
          <Button
            variant="outline"
            onClick={handleAccountClick}
            className="h-11 gap-3 rounded-2xl border-gray-200 bg-white px-5 text-[#1b1c23] shadow-sm transition-all duration-200 hover:bg-gray-50 hover:text-[#1b1c23] hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
          >
            <div className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8c8fff] opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#8c8fff]"></span>
            </div>

            <span className="font-manrope font-bold tracking-tight">
              {shortAddress}
            </span>
          </Button>

          {/* Custom Dropdown */}
          <div
            className={`absolute right-0 top-full z-50 mt-2 w-72 translate-y-2 transition-all duration-200 origin-top-right
              ${showDropdown ? "opacity-100 visible translate-y-0 scale-100" : "opacity-0 invisible translate-y-2 scale-95 pointer-events-none"}`}
          >
            <div className="rounded-2xl border border-gray-100 bg-white p-4 text-popover-foreground shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-manrope font-bold text-[#1b1c23]">
                    Wallet Connected
                  </h4>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-[#8c8fff]">
                    Active
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

                  {/* FIX: Add Disconnect button for Embedded users */}
                  {isEmbedded && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-full justify-center rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={handleDisconnect}
                    >
                      <LogOut className="mr-2 h-3.5 w-3.5" /> Disconnect
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isLoading}
      className="h-11 rounded-2xl bg-[#1b1c23] px-6 text-base font-bold text-white shadow-lg hover:bg-[#2c2d33]"
    >
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
