import React from "react";
import { useRouter } from "next/navigation"; // 1. Import useRouter
import type { Dispute } from "./DisputesList";
import { CrowdfundingIcon, PersonIcon, VoteIcon } from "./icons/BadgeIcons";
import { ApproveIcon, RejectIcon } from "./icons/Icon";
import { StarIcon } from "./icons/BadgeIcons";

interface DisputeCardProps {
  dispute: Dispute;
}

const getIconByCategory = (category: string) => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("tech")) return "/images/icons/bar-chart-icon.svg";
  if (cat.includes("freelance")) return "/images/icons/person-icon.svg";
  return "/images/icons/stellar-fund-icon.svg";
};

export const DisputeCard: React.FC<DisputeCardProps> = ({ dispute }) => {
  const router = useRouter(); // 2. Initialize router

  const handleReadDispute = () => {
    // 3. Navigate to the detailed view
    router.push(`/disputes/${dispute.id}`);
  };

  return (
    <div className="bg-white rounded-[18px] shadow-[0px_2px_4px_0px_rgba(27,28,35,0.1)] p-[22px] relative w-full h-[261px] flex flex-col justify-between box-border shrink-0">
      {/* Header */}
      <div className="flex items-start gap-[17px] mb-5 shrink-0">
        <div className="w-[55px] h-[55px] shrink-0">
          {dispute.icon ? (
            <img
              src={dispute.icon}
              alt={dispute.title}
              className="w-full h-full rounded-[14px] object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-[14px] bg-[#f5f6f9] flex items-center justify-center p-1">
              <img
                src={getIconByCategory(dispute.category)}
                alt={dispute.category}
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-manrope font-extrabold text-[15px] leading-none text-[#1b1c23] tracking-[-0.3px] m-0 mb-2.5">
            {dispute.title}
          </h3>
          <div className="flex gap-2 items-center flex-wrap">
            <span className="bg-[rgba(140,143,255,0.2)] text-[#1b1c23] px-3 h-[23px] rounded-[11.5px] font-manrope font-extrabold text-[10px] tracking-[-0.2px] leading-none inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
              <CrowdfundingIcon size={9} color="#8c8fff" className="shrink-0" />
              {dispute.category}
            </span>
            <span className="bg-[rgba(140,143,255,0.2)] text-[#1b1c23] px-3 h-[23px] rounded-[11.5px] font-manrope font-extrabold text-[10px] tracking-[-0.2px] leading-none inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
              <PersonIcon size={10} color="#8c8fff" className="shrink-0" />
              {dispute.votesCount}/{dispute.totalVotes} votes
            </span>
          </div>
        </div>
      </div>

      {/* Content (Vote Section) */}
      <div className="bg-[#f5f6f9] rounded-xl p-[22px] w-full h-16 flex flex-col justify-start shrink-0 box-border">
        <div className="flex flex-col gap-2.5 w-full flex-1">
          <div className="font-manrope font-extrabold text-xs text-[#1b1c23] tracking-[-0.24px] flex items-center gap-1.5">
            <VoteIcon size={16} color="#1b1c23" />
            Your vote was:
          </div>
          <div className="flex gap-2 items-center justify-start w-full">
            {dispute.voters.map((voter, index) => (
              <div
                key={index}
                className="relative w-32 h-4 bg-white rounded-lg flex items-center gap-2 p-[9px_10px] shrink-0 box-border"
              >
                <div className="w-3 h-3 rounded-full overflow-hidden shrink-0 bg-[#8c8fff] flex items-center justify-center relative">
                  {voter.avatar ? (
                    <>
                      <img
                        src={voter.avatar}
                        alt={voter.name}
                        className="w-full h-full object-cover absolute top-0 left-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const placeholder =
                            target.parentElement?.querySelector(
                              ".avatar-placeholder",
                            ) as HTMLElement;
                          if (placeholder) placeholder.style.display = "flex";
                        }}
                      />
                      <div className="avatar-placeholder w-full h-full bg-[#8c8fff] text-white hidden items-center justify-center font-manrope font-extrabold text-[10px] rounded-full absolute top-0 left-0">
                        {voter.name.charAt(0)}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-[#8c8fff] text-white flex items-center justify-center font-manrope font-extrabold text-[10px] rounded-full absolute top-0 left-0">
                      {voter.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="font-manrope font-extrabold text-[10px] text-[#1b1c23] tracking-[-0.2px] leading-tight flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis pr-6">
                  {voter.name}
                </div>
                <div className="absolute top-3 right-2.5 w-[19px] h-[19px] shrink-0 flex items-center justify-center pointer-events-none">
                  {voter.vote === "approve" ? <ApproveIcon /> : <RejectIcon />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center shrink-0 mt-5 w-full gap-3">
        <div className="flex items-center gap-1 font-manrope font-extrabold text-sm text-[#14141a] tracking-[-0.28px] leading-[1.14]">
          <StarIcon size={15} className="shrink-0" />
          <span>{dispute.prize}</span>
        </div>
        
        {/* 4. Update Button Logic */}
        <button 
          onClick={handleReadDispute}
          className="bg-[#8c8fff] text-white border-none rounded-[12.5px] px-4 py-2 h-[25px] font-manrope font-extrabold text-[11px] tracking-[-0.33px] cursor-pointer transition-all duration-200 flex items-center justify-center whitespace-nowrap hover:opacity-90 hover:scale-105 active:scale-95 shadow-md"
        >
          Read Dispute
        </button>
      </div>
    </div>
  );
};