import React from "react";

interface AmountSelectorProps {
  selectedAmount: number;
  onAmountChange: (amount: number) => void;
}

const AMOUNTS = [1, 25, 50, 75, 100];

export const AmountSelector: React.FC<AmountSelectorProps> = ({
  selectedAmount,
  onAmountChange,
}) => {
  const getSliderPosition = () => {
    const index = AMOUNTS.indexOf(selectedAmount);
    if (index === -1) return 0;
    return (index / (AMOUNTS.length - 1)) * 100;
  };

  const handleAmountClick = (amount: number) => {
    onAmountChange(amount);
  };

  const position = getSliderPosition();

  return (
    <div className="w-full px-7 mt-[50px] mb-5 relative flex flex-col items-center min-h-[80px]">
      {/* Selected Label Bubble */}
      <div
        className="bg-[#8c8fff] rounded-lg px-3 h-6 flex items-center justify-center font-manrope font-extrabold text-xs text-white tracking-[-0.36px] leading-none mb-2 absolute -top-[35px] whitespace-nowrap min-w-[58px] transition-[left] duration-200 ease-linear z-10"
        style={{
          left: `${position}%`,
          transform: "translateX(-50%)",
        }}
      >
        <span>{selectedAmount} USDC</span>
      </div>

      {/* Slider Container */}
      <div className="w-full max-w-[301px] relative mb-5">
        {/* Track */}
        <div className="w-full h-[5px] bg-[#e7eefb] rounded-[4px] relative overflow-hidden">
          {/* Fill Gradient */}
          <div
            className="h-full bg-gradient-to-b from-[#8c8fff] to-[#7eb5fd] rounded-[4px] absolute left-0 top-0 transition-[width] duration-200 ease-linear"
            style={{ width: `${position}%` }}
          />
        </div>

        {/* Range Input (Invisible overlay for interaction) */}
        <input
          type="range"
          min="0"
          max={AMOUNTS.length - 1}
          value={AMOUNTS.indexOf(selectedAmount)}
          onChange={(e) => {
            const index = parseInt(e.target.value);
            onAmountChange(AMOUNTS[index]);
          }}
          className="absolute top-0 left-0 w-full h-[5px] opacity-0 cursor-pointer z-[2] m-0"
        />

        {/* Handle Knob */}
        <div
          className="absolute -top-[4.5px] w-[14px] h-[14px] bg-white border-2 border-[#8c8fff] rounded-full cursor-pointer z-[3] transition-[left] duration-200 ease-linear pointer-events-none"
          style={{ left: `calc(${position}% - 7px)` }}
        />
      </div>

      {/* Amount Labels */}
      <div className="w-full max-w-[301px] relative h-4 mt-2">
        {AMOUNTS.map((amount) => (
          <button
            key={amount}
            className={`absolute top-0 bg-transparent border-none font-manrope text-sm text-[#31353b] tracking-[-0.36px] leading-[1.25] cursor-pointer p-0 transition-opacity duration-200 whitespace-nowrap ${amount === selectedAmount
                ? "opacity-100 font-extrabold"
                : "opacity-80 font-semibold hover:opacity-100"
              }`}
            onClick={() => handleAmountClick(amount)}
            style={{
              left: `${(AMOUNTS.indexOf(amount) / (AMOUNTS.length - 1)) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            ${amount}
          </button>
        ))}
      </div>
    </div>
  );
};
