import React from "react";
import { CrowdfundingIcon, PersonIcon } from "../disputes/icons/BadgeIcons";
import { CalendarIcon } from "./CalendarIcon";
import { CheckCircle2 } from "lucide-react";

interface Actor {
  name: string;
  role: "Claimer" | "Defender";
  avatar?: string;
  isWinner?: boolean;
}

interface Dispute {
  id: string;
  title: string;
  logo?: string;
  category: string;
  actors: Actor[];
  generalContext: string;
  creationDate: string;
  deadline: string;
  votesCount?: number;
  totalVotes?: number;
  status?: string;
}

interface DisputeInfoCardProps {
  dispute: Dispute;
}

export const DisputeInfoCard: React.FC<DisputeInfoCardProps> = ({
  dispute,
}) => {
  return (
    <div className="bg-white rounded-[18px] p-[22px] mt-4 mx-[19px] flex flex-col gap-5 box-border">
      {/* Header with logo and title */}
      <div className="flex items-start gap-3">
        <div className="w-[55px] h-[55px] rounded-lg bg-[#f5f6f9] flex items-center justify-center shrink-0 overflow-hidden">
          {dispute.logo ? (
            <img
              src={dispute.logo}
              alt={dispute.title}
              className="w-full h-full object-contain p-1"
            />
          ) : (
            <div className="w-full h-full bg-[#8c8fff] rounded-lg" />
          )}
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <h2 className="font-manrope font-extrabold text-lg text-[#1b1c23] tracking-[-0.54px] leading-[1.2] m-0">
            {dispute.title}
          </h2>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 bg-[#8c8fff33] text-[#1b1c23] px-2 py-1 rounded-[11.5px] font-manrope font-extrabold text-[10px] tracking-[-0.2px] w-fit h-[23px]">
              <CrowdfundingIcon size={9} color="#1b1c23" />
              {dispute.category}
            </span>

            {/* Status / Votes Badge */}
            {dispute.status && (
              <span
                className={`inline-flex items-center gap-1 bg-[#8c8fff33] text-[#1b1c23] px-2 py-1 rounded-[11.5px] font-manrope font-extrabold text-[10px] tracking-[-0.2px] w-fit h-[23px] ${dispute.status === "Executed" ? "bg-green-100 text-green-700" : ""}`}
              >
                {dispute.status === "Executed" ? "Resolved" : "Active"}
              </span>
            )}

            {dispute.totalVotes !== undefined && (
              <span className="inline-flex items-center gap-1 bg-[#8c8fff33] text-[#1b1c23] px-2 py-1 rounded-[11.5px] font-manrope font-extrabold text-[10px] tracking-[-0.2px] w-fit h-[23px]">
                <PersonIcon size={10} color="#8c8fff" />
                {dispute.votesCount || 0}/{dispute.totalVotes} Votes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actors */}
      <div className="flex flex-col gap-3">
        {dispute.actors.map((actor, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 bg-[#f5f6f9] rounded-xl p-3 ${actor.isWinner ? "bg-green-50 border border-green-200" : ""}`}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-[#8c8fff] relative">
              {actor.avatar ? (
                <>
                  <img
                    src={actor.avatar}
                    alt={actor.name}
                    className="w-full h-full object-cover absolute top-0 left-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const placeholder = target.parentElement?.querySelector(
                        ".avatar-placeholder",
                      ) as HTMLElement;
                      if (placeholder) {
                        placeholder.style.display = "flex";
                      }
                    }}
                  />
                  <div className="avatar-placeholder w-full h-full bg-[#8c8fff] text-white hidden items-center justify-center font-manrope font-extrabold text-base rounded-full absolute top-0 left-0">
                    {actor.name.charAt(0)}
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-[#8c8fff] text-white flex items-center justify-center font-manrope font-extrabold text-base rounded-full absolute top-0 left-0">
                  {actor.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="font-manrope font-bold text-sm text-[#1b1c23] tracking-[-0.28px] leading-[1.2]">
                  {actor.name}
                </div>
                {/* Winner Badge */}
                {actor.isWinner && (
                  <span className="bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    WINNER
                  </span>
                )}
              </div>
              <div className="font-manrope font-semibold text-xs text-[#8c8fff] tracking-[-0.24px] leading-[1.2]">
                {actor.role}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* General Context */}
      <div className="flex flex-col gap-3">
        <h3 className="font-manrope font-extrabold text-base text-[#1b1c23] tracking-[-0.32px] leading-[1.2] m-0">
          General Context:
        </h3>
        <p className="font-manrope font-normal text-sm text-[#31353b] tracking-[-0.28px] leading-relaxed m-0">
          {dispute.generalContext}
        </p>
      </div>

      {/* Dates */}
      <div className="flex gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <div className="font-manrope font-extrabold text-[13px] text-[#1b1c23] tracking-[-0.26px] leading-[1.2]">
            Creation Date
          </div>
          <div className="inline-flex items-center gap-1.5 bg-[#8c8fff33] text-[#1b1c23] px-2.5 py-1.5 rounded-[11.5px] font-manrope font-extrabold text-[10px] tracking-[-0.2px] w-fit h-[23px]">
            <CalendarIcon
              size={10}
              color="#8c8fff"
              className="shrink-0 block w-2.5 h-[11.6px]"
            />
            {dispute.creationDate}
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <div className="font-manrope font-extrabold text-[13px] text-[#1b1c23] tracking-[-0.26px] leading-[1.2]">
            Max Deadline
          </div>
          <div className="inline-flex items-center gap-1.5 bg-[#8c8fff33] text-[#1b1c23] px-2.5 py-1.5 rounded-[11.5px] font-manrope font-extrabold text-[10px] tracking-[-0.2px] w-fit h-[23px]">
            <CalendarIcon
              size={10}
              color="#8c8fff"
              className="shrink-0 block w-2.5 h-[11.6px]"
            />
            {dispute.deadline}
          </div>
        </div>
      </div>
    </div>
  );
};
