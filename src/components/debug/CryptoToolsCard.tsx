import React, { useState } from "react";
import { Hash } from "lucide-react";
import { toast } from "sonner";
import { calculateCommitment, generateSalt } from "@/util/votingUtils";

export const CryptoToolsCard = () => {
  const [toolSalt, setToolSalt] = useState("");
  const [toolHash, setToolHash] = useState("");
  const toolVote = 1; // Default for tool

  const handleCalculateHash = () => {
    if (!toolSalt) {
      const s = generateSalt();
      setToolSalt(s.toString());
      const h = calculateCommitment(toolVote, s);
      setToolHash(h);
    } else {
      try {
        const h = calculateCommitment(toolVote, BigInt(toolSalt));
        setToolHash(h);
      } catch (_e) {
        toast.error("Invalid salt format");
      }
    }
  };

  return (
    <div className="bg-white rounded-[18px] p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
      <h3 className="font-bold text-sm text-[#1b1c23] flex items-center gap-2">
        <Hash className="w-4 h-4 text-[#8c8fff]" /> Crypto Tools
      </h3>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Salt (Empty to Generate)"
          value={toolSalt}
          onChange={(e) => setToolSalt(e.target.value)}
          className="flex-1 bg-[#f5f6f9] rounded-lg p-2 text-xs font-mono border-transparent border focus:border-[#8c8fff] outline-none transition-colors"
        />
        <button
          onClick={handleCalculateHash}
          className="px-3 bg-gray-100 rounded-lg text-xs font-bold hover:bg-gray-200 active:scale-95 transition-all"
        >
          Calc Hash (Vote=1)
        </button>
      </div>
      {toolHash && (
        <div className="p-3 bg-gray-900 rounded-lg text-[9px] font-mono text-white break-all border border-gray-700">
          <span className="text-gray-500 select-none">Result: </span>
          {toolHash}
        </div>
      )}
    </div>
  );
};
