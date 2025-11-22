import React from "react";

interface CalendarIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const CalendarIcon: React.FC<CalendarIconProps> = ({ 
  className, 
  size = 10, 
  color = "#8c8fff" 
}) => {
  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 10 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d="M7.5 0C7.96024 0 8.33301 0.372771 8.33301 0.833008V1.82422C9.30367 2.19881 9.99999 3.20635 10 4.39355V8.93945C9.99979 10.4455 8.88058 11.666 7.5 11.666H2.5C1.16241 11.666 0.0698532 10.5201 0.00292969 9.0791L0 8.93945V4.39355C6.07455e-06 3.20635 0.696335 2.19881 1.66699 1.82422V0.833008C1.66699 0.372791 2.03979 3.38387e-05 2.5 0C2.96024 0 3.33301 0.372771 3.33301 0.833008V1.66602H6.66699V0.833008C6.66699 0.372792 7.03979 3.39676e-05 7.5 0ZM1.16699 5.83301V8.93945C1.1672 9.74258 1.76375 10.3936 2.5 10.3936H7.5C8.23625 10.3936 8.8328 9.74258 8.83301 8.93945V5.83301H1.16699Z"
        fill={color}
      />
    </svg>
  );
};

