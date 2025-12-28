import React, { useState } from "react";
import {
  List,
  Users,
  Clock,
  Shield,
  CreditCard,
  Gavel,
  Eye,
  Play,
  Database,
  CheckCircle,
  Copy,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface DisputeInspectorProps {
  data: any; // The rawDisputeData object
  localStorageData: any;
  onJoin: () => void;
  onPay: () => void;
  onVote: (val: number) => void;
  onReveal: () => void;
  onExecute: () => void;
  isPaying: boolean;
  isVoting: boolean;
  logs: string;
}

export const DisputeInspector: React.FC<DisputeInspectorProps> = ({
  data,
  localStorageData,
  onJoin,
  onPay,
  onVote,
  onReveal,
  onExecute,
  isPaying,
  isVoting,
  logs,
}) => {
  const [saltCopied, setSaltCopied] = useState(false);

  const handleCopySalt = () => {
    if (!localStorageData?.salt) return;
    navigator.clipboard.writeText(localStorageData.salt);
    setSaltCopied(true);
    setTimeout(() => setSaltCopied(false), 2000);
    toast.success("Salt copied");
  };

  if (!data)
    return (
      <div className="bg-white rounded-[24px] p-10 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-2 opacity-50">
        <AlertCircle className="w-8 h-8 text-gray-300" />
        <span className="text-sm font-bold text-gray-400">
          No Dispute Selected
        </span>
      </div>
    );

  return (
    <div className="bg-white rounded-[24px] p-6 shadow-md border border-gray-100 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#1b1c23] flex items-center gap-2">
            #{data.id}
            <span className="text-xs font-medium text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-lg">
              {data.category}
            </span>
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                data.statusIndex === 0
                  ? "bg-blue-100 text-blue-700"
                  : data.statusIndex === 1
                    ? "bg-purple-100 text-purple-700"
                    : data.statusIndex === 2
                      ? "bg-orange-100 text-orange-700"
                      : "bg-green-100 text-green-700"
              }`}
            >
              {data.status} Phase
            </span>
            {data.userRole !== "None/Juror" && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#1b1c23] text-white">
                You are {data.userRole}
              </span>
            )}
          </div>
        </div>
        {data.ipfsHash !== "None" && (
          <a
            href={`https://gateway.pinata.cloud/ipfs/${data.ipfsHash}`}
            target="_blank"
            rel="noreferrer"
            className="p-2 bg-[#f5f6f9] rounded-lg hover:bg-gray-200 transition-colors"
          >
            <List className="w-4 h-4 text-[#1b1c23]" />
          </a>
        )}
      </div>

      {/* Parties Info */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Users className="w-3 h-3" /> Parties involved
        </h4>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-[60px_1fr] items-center gap-2">
            <span className="text-[10px] font-bold text-[#1b1c23] bg-white border border-gray-100 px-1.5 py-0.5 rounded text-center">
              Claimer
            </span>
            <span className="font-mono text-[10px] text-gray-600 break-all select-all">
              {data.claimer}
            </span>
          </div>
          <div className="grid grid-cols-[60px_1fr] items-center gap-2">
            <span className="text-[10px] font-bold text-[#1b1c23] bg-white border border-gray-100 px-1.5 py-0.5 rounded text-center">
              Defender
            </span>
            <span className="font-mono text-[10px] text-gray-600 break-all select-all">
              {data.defender}
            </span>
          </div>
          <div className="border-t border-gray-200 my-1"></div>
          <div className="grid grid-cols-[60px_1fr] items-center gap-2">
            <span className="text-[10px] font-bold text-white bg-[#8c8fff] px-1.5 py-0.5 rounded text-center">
              Winner
            </span>
            <span className="font-mono text-[10px] text-[#8c8fff] font-bold break-all select-all">
              {data.winner}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="flex flex-col gap-1">
          <span className="text-gray-400 font-bold uppercase">Jurors</span>
          <span className="font-mono text-[#1b1c23] font-semibold">
            {data.jurorsRequired} Needed
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-gray-400 font-bold uppercase">Stake</span>
          <span className="font-mono text-[#1b1c23] font-semibold">
            {data.requiredStake}
          </span>
        </div>
        <div className="col-span-2 flex flex-col gap-1 bg-[#f5f6f9] p-3 rounded-xl">
          <span className="text-gray-400 font-bold uppercase flex items-center gap-1">
            <Clock className="w-3 h-3" /> Deadlines
          </span>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <div>
              <span className="block text-[9px] text-gray-400">Pay</span>
              <span className="font-mono font-bold">
                {data.payDeadline.split(",")[0]}
              </span>
            </div>
            <div>
              <span className="block text-[9px] text-gray-400">Commit</span>
              <span className="font-mono font-bold">
                {data.commitDeadline.split(",")[0]}
              </span>
            </div>
            <div>
              <span className="block text-[9px] text-gray-400">Reveal</span>
              <span className="font-mono font-bold">
                {data.revealDeadline.split(",")[0]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
        <h3 className="font-bold text-xs text-[#8c8fff] uppercase tracking-wider">
          Available Actions
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onJoin}
            className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 active:scale-[0.98] transition-all border border-blue-100 shadow-sm"
          >
            <div className="p-2 bg-white rounded-full shadow-sm">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Join Jury</span>
          </button>

          <button
            onClick={onPay}
            disabled={isPaying}
            className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 active:scale-[0.98] transition-all border border-green-100 shadow-sm disabled:opacity-50"
          >
            <div className="p-2 bg-white rounded-full shadow-sm">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Pay Stake</span>
          </button>

          <button
            onClick={() => onVote(1)}
            disabled={isVoting}
            className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 active:scale-[0.98] transition-all border border-gray-200 shadow-sm disabled:opacity-50"
          >
            <div className="p-2 bg-white rounded-full shadow-sm">
              <Gavel className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Vote (1)</span>
          </button>

          <button
            onClick={onReveal}
            disabled={isVoting}
            className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 active:scale-[0.98] transition-all border border-purple-100 shadow-sm disabled:opacity-50"
          >
            <div className="p-2 bg-white rounded-full shadow-sm">
              <Eye className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Reveal</span>
          </button>
        </div>

        <button
          onClick={onExecute}
          className="w-full py-3.5 bg-[#1b1c23] text-white rounded-xl font-bold text-xs hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md mt-1"
        >
          <Play className="w-3.5 h-3.5 fill-white" /> Force Execute Ruling
        </button>

        {logs && (
          <div className="p-4 bg-gray-900 rounded-xl text-[10px] font-mono text-green-400 whitespace-pre-wrap border border-gray-800 shadow-inner max-h-40 overflow-auto">
            <span className="opacity-50 mr-2">{">"}</span>
            {logs}
          </div>
        )}
      </div>

      {/* Local Storage Inspector */}
      {localStorageData && (
        <div className="bg-[#f5f6f9] p-4 rounded-xl border border-dashed border-gray-300 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
              <Database className="w-3 h-3" /> Local Secrets Found
            </span>
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
              <CheckCircle className="w-3 h-3" />
              <span className="text-[10px] font-bold">Persisted</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-gray-500">Vote Choice:</span>
            <span className="bg-white border border-gray-200 px-2 py-1 rounded-md font-mono font-bold text-[#1b1c23]">
              {localStorageData.vote}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-gray-500 text-xs">
              Secret Salt:
            </span>
            <div className="flex items-start gap-2">
              <div
                className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-[10px] font-mono text-[#1b1c23] break-all leading-relaxed"
                title={localStorageData.salt}
              >
                {localStorageData.salt.length > 20
                  ? `${localStorageData.salt.slice(0, 10)}...${localStorageData.salt.slice(-4)}`
                  : localStorageData.salt}
              </div>
              <button
                onClick={handleCopySalt}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95 transition-all text-gray-500 hover:text-[#1b1c23] shrink-0"
              >
                {saltCopied ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
