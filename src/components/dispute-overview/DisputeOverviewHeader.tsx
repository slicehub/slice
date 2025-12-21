import React from "react";

interface DisputeOverviewHeaderProps {
  onBack: () => void;
}

export const DisputeOverviewHeader: React.FC<DisputeOverviewHeaderProps> = ({ onBack }) => {
  return (
    <div className="w-full pt-9 px-[18px] pb-0 flex items-start relative">
      <button
        className="bg-white border-none rounded-lg w-10 h-10 flex items-center justify-center cursor-pointer transition-opacity duration-200 p-0 shadow-sm hover:opacity-70"
        onClick={onBack}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block"
        >
          <path
            d="M15 18L9 12L15 6"
            stroke="#1b1c23"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};
