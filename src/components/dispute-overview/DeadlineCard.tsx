import React from "react";
import { CalendarIcon } from "./CalendarIcon";

interface DeadlineCardProps {
  deadline: string;
}

export const DeadlineCard: React.FC<DeadlineCardProps> = ({ deadline }) => {
  return (
    <div className="bg-white rounded-xl p-3 mt-5 mx-[19px] flex items-center gap-2.5 box-border">
      <span className="flex-1 font-manrope font-semibold text-[13px] text-[#1b1c23] tracking-[-0.26px] leading-tight">
        Resolution Deadline:
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        <CalendarIcon size={10} color="#1b1c23" />
        <span className="font-manrope font-bold text-[13px] text-[#1b1c23] tracking-[-0.26px] leading-tight whitespace-nowrap">
          {deadline}
        </span>
      </div>
    </div>
  );
};
