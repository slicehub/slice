import React from "react";

export const InfoCard: React.FC = () => {
  return (
    <div className="bg-white rounded-[19px] w-[358px] min-h-[74px] mt-5 p-[11px] flex items-center gap-3 box-border">
      <div className="shrink-0 w-[51px] h-[51px] flex items-center justify-center">
        <div className="w-[51px] h-[51px] bg-[#8c8fff] rounded-full flex items-center justify-center relative">
          <img
            src="/images/category-amount/alert-icon.svg"
            alt="Alert"
            className="w-8 h-8 block"
          />
        </div>
      </div>
      <p className="flex-1 font-manrope font-bold text-[11px] text-[#1b1c23] tracking-[-0.22px] leading-[1.36] m-0 min-w-0">
        Once you start a dispute, funds will be released and cannot be recovered
      </p>
    </div>
  );
};
