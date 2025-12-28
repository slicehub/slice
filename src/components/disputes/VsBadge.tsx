import React from "react";

export function VsBadge() {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2 mt-2.5 z-20 pointer-events-none">
      <div className="bg-white p-1 rounded-full shadow-sm border border-gray-100">
        <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
          <span className="text-[9px] font-black text-gray-200">VS</span>
        </div>
      </div>
    </div>
  );
}
