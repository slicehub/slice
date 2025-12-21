import React from "react";
import { useTimer } from "@/contexts/TimerContext";

export const TimerCard: React.FC = () => {
  const { timeInSeconds } = useTimer();

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white rounded-xl p-3 mt-5 mx-[19px] flex items-center gap-2.5 box-border">
      <div className="flex items-center gap-1.5 shrink-0">
        <video
          src="/animations/time.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-[31px] h-[31px] shrink-0 block"
        />
        <span className="font-manrope font-bold text-[13px] text-[#1b1c23] tracking-[-0.26px] leading-tight whitespace-nowrap">
          {formatTime(timeInSeconds)}min
        </span>
      </div>
      <span className="flex-1 font-manrope font-semibold text-[13px] text-[#1b1c23] tracking-[-0.26px] leading-tight">
        Time available to vote:
      </span>
    </div>
  );
};
