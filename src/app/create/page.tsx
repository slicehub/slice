"use client";

import React, { useState } from "react";
import { useCreateDispute } from "@/hooks/useCreateDispute";
import {
  Loader2,
  UploadCloud,
  ShieldAlert,
  Users,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CreateDisputePage() {
  const router = useRouter();
  const { createDispute, isCreating } = useCreateDispute();

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [defenderAddress, setDefenderAddress] = useState("");
  const [evidenceLink, setEvidenceLink] = useState("");
  const [jurorsRequired, setJurorsRequired] = useState(3);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !defenderAddress) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Basic validation for odd number of jurors to prevent ties
    if (jurorsRequired % 2 === 0) {
      toast.error("Please select an odd number of jurors to prevent ties.");
      return;
    }

    const disputeData = {
      title,
      description,
      category,
      evidence: evidenceLink ? [evidenceLink] : [],
      created_at: new Date().toISOString(),
    };

    await createDispute(defenderAddress, category, disputeData, jurorsRequired);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4">
      <div className="flex items-center gap-4 mb-6 mt-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-[#1b1c23]" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b1c23]">
            Create Dispute
          </h1>
          <p className="text-sm text-gray-500">
            Initiate a new claim on-chain.
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[18px] p-6 shadow-sm border border-gray-100 flex flex-col gap-6 overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#1b1c23]">
              Dispute Title
            </label>
            <input
              type="text"
              className="p-3 bg-[#f5f6f9] rounded-xl text-sm border-none focus:ring-2 focus:ring-[#8c8fff] outline-none"
              placeholder="e.g. Freelance work not paid"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isCreating}
            />
          </div>

          {/* ... [Category Select] ... */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#1b1c23]">Category</label>
            <select
              className="p-3 bg-[#f5f6f9] rounded-xl text-sm border-none focus:ring-2 focus:ring-[#8c8fff] outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isCreating}
            >
              <option value="General">General Court</option>
              <option value="Tech">Tech & Software</option>
              <option value="Freelance">Freelance & Services</option>
              <option value="E-Commerce">E-Commerce</option>
            </select>
          </div>

          {/* ... [Defender Address Input] ... */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#1b1c23]">
              Defendant Address
            </label>
            <input
              type="text"
              className="p-3 bg-[#f5f6f9] rounded-xl text-sm font-mono border-none focus:ring-2 focus:ring-[#8c8fff] outline-none"
              placeholder="0x..."
              value={defenderAddress}
              onChange={(e) => setDefenderAddress(e.target.value)}
              disabled={isCreating}
            />
          </div>

          {/* NEW: Jurors Required Input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#1b1c23] flex justify-between">
              <span>Jurors Needed</span>
              <span className="text-[#8c8fff] font-normal">
                {jurorsRequired} Jurors
              </span>
            </label>
            <div className="flex items-center gap-4 bg-[#f5f6f9] p-3 rounded-xl">
              <Users size={18} className="text-gray-400" />
              <input
                type="range"
                min="1"
                max="11"
                step="2" // Steps of 2 ensures odd numbers (3, 5, 7, 9, 11)
                value={jurorsRequired}
                onChange={(e) => setJurorsRequired(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#8c8fff]"
                disabled={isCreating}
              />
            </div>
            <p className="text-xs text-gray-400">
              Odd numbers only to avoid ties (3, 5, 7...).
            </p>
          </div>

          {/* ... [Description Textarea] ... */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#1b1c23]">
              Description
            </label>
            <textarea
              className="p-3 bg-[#f5f6f9] rounded-xl text-sm border-none focus:ring-2 focus:ring-[#8c8fff] outline-none min-h-[120px] resize-none"
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isCreating}
            />
          </div>

          {/* ... [Evidence Input] ... */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#1b1c23]">
              Evidence Link (Optional)
            </label>
            <div className="flex items-center gap-2 bg-[#f5f6f9] rounded-xl p-3">
              <UploadCloud size={16} className="text-gray-400" />
              <input
                type="text"
                className="bg-transparent text-sm border-none focus:ring-0 outline-none w-full"
                placeholder="https://..."
                value={evidenceLink}
                onChange={(e) => setEvidenceLink(e.target.value)}
                disabled={isCreating}
              />
            </div>
          </div>

          <div className="mt-4">
            <Button
              type="submit"
              disabled={isCreating}
              className={`
                w-full py-6 rounded-xl font-manrope font-extrabold text-sm tracking-tight
                flex items-center justify-center gap-2 transition-all
                ${isCreating ? "bg-gray-300" : "bg-[#1b1c23] hover:bg-[#31353b] text-white"}
              `}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading to IPFS & Signing...
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  CREATE DISPUTE
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
