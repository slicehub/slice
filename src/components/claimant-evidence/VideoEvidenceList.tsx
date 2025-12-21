import React from "react";
import { VideoEvidenceCard } from "./VideoEvidenceCard";
import { PlayIcon } from "./icons/EvidenceIcons";

interface Evidence {
  id: string;
  type: "video";
  url: string;
  thumbnail?: string;
  description: string;
  uploadDate: string;
}

interface VideoEvidenceListProps {
  evidenceList: Evidence[];
}

export const VideoEvidenceList: React.FC<VideoEvidenceListProps> = ({ evidenceList }) => {
  return (
    <div className="mt-5 flex flex-col gap-3">
      <div className="mx-[19px] flex flex-col gap-3">
        <span className="inline-flex items-center gap-1 bg-[rgba(140,143,255,0.2)] text-[#1b1c23] px-2 py-1 rounded-[11.5px] font-manrope font-extrabold text-[10px] tracking-[-0.2px] w-fit h-[23px]">
          <PlayIcon size={10} color="#1b1c23" />
          Videos
        </span>
      </div>
      <div className="overflow-x-auto overflow-y-hidden no-scrollbar pb-5">
        <div className="flex gap-4 px-[19px] w-max">
          {evidenceList.map((evidence) => (
            <VideoEvidenceCard key={evidence.id} evidence={evidence} />
          ))}
        </div>
      </div>
    </div>
  );
};
