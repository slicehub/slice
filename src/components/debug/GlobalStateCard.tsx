import React from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, User, Activity } from "lucide-react";

interface ContractInfo {
  count: string;
}

interface GlobalStateCardProps {
  contractInfo: ContractInfo;
  isCreating: boolean;
  onCreate: () => void;
  myPartyDisputes: string[];
  myJurorDisputes: string[];
  targetId: string;
  onSelectId: (id: string) => void;
}

export const GlobalStateCard: React.FC<GlobalStateCardProps> = ({
  contractInfo,
  isCreating,
  onCreate,
  myPartyDisputes,
  myJurorDisputes,
  targetId,
  onSelectId,
}) => {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      {/* Global Stats & Factory */}
      {/* CHANGED: flex-col to stack items vertically */}
      <div className="bg-white rounded-[18px] p-5 shadow-sm border border-gray-100 flex flex-col gap-4 items-start">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-3 h-3" /> Total Disputes
          </span>
          <p className="text-3xl font-extrabold text-[#1b1c23] mt-1">
            {contractInfo ? contractInfo.count : "-"}
          </p>
        </div>

        {/* Buttons Container (Now Below) */}
        <div className="flex flex-wrap gap-2 w-full">
          {/* 1. Button to Create Page (UI) */}
          <button
            onClick={() => router.push("/create")}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-[#1b1c23] rounded-xl font-bold text-xs hover:bg-gray-50 transition-colors shadow-sm active:scale-95"
          >
            <Plus className="w-3 h-3" />
            Create Page
          </button>

          {/* 2. Button for Quick Debug Create (Auto) */}
          <button
            onClick={onCreate}
            disabled={isCreating}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1b1c23] text-white rounded-xl font-bold text-xs hover:bg-[#2c2d33] transition-colors shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isCreating ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
            Quick Create
          </button>
        </div>
      </div>

      {/* My Involvements */}
      {(myPartyDisputes.length > 0 || myJurorDisputes.length > 0) && (
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-[#8c8fff]" /> My Involvements
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {myPartyDisputes.map((id) => (
              <button
                key={`party-${id}`}
                onClick={() => onSelectId(id)}
                className={`shrink-0 px-4 py-2 rounded-xl border font-bold text-xs transition-all ${
                  targetId === id
                    ? "bg-[#1b1c23] text-white border-[#1b1c23]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#8c8fff]"
                }`}
              >
                #{id} (Party)
              </button>
            ))}
            {myJurorDisputes.map((id) => (
              <button
                key={`juror-${id}`}
                onClick={() => onSelectId(id)}
                className={`shrink-0 px-4 py-2 rounded-xl border font-bold text-xs transition-all ${
                  targetId === id
                    ? "bg-[#8c8fff] text-white border-[#8c8fff]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#8c8fff]"
                }`}
              >
                #{id} (Juror)
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
