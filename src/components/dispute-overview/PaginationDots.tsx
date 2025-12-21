import React from "react";

interface PaginationDotsProps {
  currentIndex: number;
  total: number;
}

export const PaginationDots: React.FC<PaginationDotsProps> = ({ currentIndex, total }) => {
  return (
    <div className="flex items-center justify-center gap-2 mt-6 px-[19px]">
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full transition-colors duration-200 ease-in-out ${index === currentIndex ? "bg-[#1b1c23]" : "bg-[#d0d0d0]"}`}
        />
      ))}
    </div>
  );
};
