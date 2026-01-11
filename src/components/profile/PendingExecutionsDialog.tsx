"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Gavel, ArrowRight, Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMyDisputes } from "@/hooks/useMyDisputes";
import { Button } from "@/components/ui/button";

export const PendingExecutionsDialog = () => {
  const router = useRouter();
  const { disputes, isLoading } = useMyDisputes();

  // Filter Logic:
  // Dispute is in 'WITHDRAW' phase (Status 2 + Time Passed)
  // This means the case is decided but needs someone to click "Execute" to payout.
  const pendingExecutions = useMemo(() => {
    return disputes.filter((d) => d.phase === "WITHDRAW");
  }, [disputes]);

  if (isLoading) return null;
  if (pendingExecutions.length === 0) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="w-full py-6 rounded-2xl flex items-center justify-between px-5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100 shadow-sm mb-4 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center group-hover:bg-white transition-colors">
              <Gavel className="w-4 h-4 text-purple-700" />
            </div>
            <div className="text-left">
              <span className="block text-sm font-extrabold text-purple-800">
                Rulings Ready
              </span>
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">
                {pendingExecutions.length} Case
                {pendingExecutions.length !== 1 ? "s" : ""} to Execute
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-purple-600" />
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] rounded-[32px] p-0 overflow-hidden bg-[#F8F9FC] border-none">
        <div className="p-6 bg-white pb-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-extrabold text-[#1b1c23] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#8c8fff]" />
              Finalize Rulings
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {pendingExecutions.map((dispute) => (
              <button
                key={dispute.id}
                onClick={() => router.push(`/execute-ruling/${dispute.id}`)}
                className="w-full bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-[#8c8fff] transition-all flex items-center justify-between group text-left"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-[10px] font-bold text-gray-500">
                      #{dispute.id}
                    </span>
                    <span className="text-[10px] font-bold text-[#8c8fff] uppercase tracking-wider truncate">
                      {dispute.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#1b1c23] truncate">
                    {dispute.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Voting complete.{" "}
                    <span className="text-[#8c8fff] font-bold">
                      Execute to unlock funds.
                    </span>
                  </p>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#1b1c23] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#F8F9FC] p-4 text-center">
          <p className="text-[10px] text-gray-400 font-medium">
            Executing the ruling distributes rewards and returns stakes.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
