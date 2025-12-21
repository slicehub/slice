import React, { useRef, useState, useEffect } from "react";

interface CategoryAmountHeaderProps {
  onBack: () => void;
  onCategorySelect?: (category: string) => void;
}

const CATEGORIES = [
  { id: "General", label: "General Court" },
  { id: "Tech", label: "Tech & Software" },
  { id: "Freelance", label: "Freelance & Services" },
  { id: "E-Commerce", label: "E-Commerce" },
];

export const CategoryAmountHeader: React.FC<CategoryAmountHeaderProps> = ({
  onBack,
  onCategorySelect
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleVideoEnded = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      if (videoRef.current.duration) {
        videoRef.current.currentTime = videoRef.current.duration;
      }
    }
  };

  const handleToggle = () => setIsOpen(!isOpen);

  const handleSelect = (category: typeof CATEGORIES[0]) => {
    setSelectedCategory(category.label);
    setIsOpen(false);
    if (onCategorySelect) {
      onCategorySelect(category.id);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="w-full pt-9 px-[18px] pb-0 flex flex-col items-start gap-[27px] relative z-50 mb-4">
      <button
        className="bg-transparent border-none p-0 cursor-pointer w-[38px] h-[38px] flex items-center justify-center transition-opacity hover:opacity-70"
        onClick={onBack}
      >
        <img
          src="/images/category-amount/back-arrow.svg"
          alt="Back"
          className="w-full h-full block"
        />
      </button>

      {/* Dropdown Wrapper */}
      <div className="relative w-[336px] self-center" ref={dropdownRef}>
        <button
          className={`bg-white border-none rounded-[22.5px] h-[45px] w-full pr-[13px] flex items-center gap-0 cursor-pointer transition-all duration-200 box-border shadow-[0px_2px_4px_rgba(0,0,0,0.05)] hover:opacity-95 hover:shadow-[0px_4px_8px_rgba(0,0,0,0.08)] ${isOpen ? 'rounded-b-none shadow-none' : ''}`}
          onClick={handleToggle}
          type="button"
        >
          <div className="w-12 h-[41px] flex items-center justify-center shrink-0 rounded-l-[15px] overflow-hidden">
            <video
              ref={videoRef}
              src="/animations/category.mp4"
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover block"
              onEnded={handleVideoEnded}
            />
          </div>
          <span className="flex-1 font-manrope font-extrabold text-[15px] text-[#1b1c23] tracking-[-0.45px] leading-none text-left pl-3">
            {selectedCategory || "Select a category"}
          </span>
          <img
            src="/images/category-amount/chevron-down.svg"
            alt="Dropdown"
            className="w-[13px] h-2 shrink-0 mr-[13px] transition-transform duration-200"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>

        {isOpen && (
          <div className="absolute top-[45px] left-0 w-full bg-white rounded-b-[18px] py-2 flex flex-col gap-0 shadow-[0px_8px_16px_rgba(27,28,35,0.1)] z-[100] box-border overflow-hidden border-t border-[#f0f0f0] animate-in fade-in slide-in-from-top-1 duration-200">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                className={`w-full px-5 py-3 bg-transparent border-none font-manrope font-semibold text-sm text-[#31353b] text-left cursor-pointer transition-all duration-200 hover:bg-[#f5f6f9] hover:text-[#1b1c23] hover:pl-6 ${selectedCategory === category.label ? 'bg-[#f5f6f9] text-[#8c8fff] font-extrabold' : ''}`}
                onClick={() => handleSelect(category)}
              >
                {category.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};