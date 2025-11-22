import React from "react";

interface IconProps {
  className?: string;
  color?: string;
  hoverColor?: string;
}

// Componente wrapper para SVG que permite cambiar color en hover
export const IconWrapper: React.FC<{
  children: React.ReactNode;
  className?: string;
  color?: string;
  hoverColor?: string;
  viewBox?: string;
  width?: string | number;
  height?: string | number;
}> = ({ children, className, color, hoverColor, viewBox, width, height }) => {
  const [currentColor, setCurrentColor] = React.useState(color || "currentColor");

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      className={className}
      style={{
        color: currentColor,
        transition: "color 0.2s",
      }}
      onMouseEnter={() => {
        if (hoverColor) setCurrentColor(hoverColor);
      }}
      onMouseLeave={() => {
        if (hoverColor) setCurrentColor(color || "currentColor");
      }}
      fill="none"
    >
      {children}
    </svg>
  );
};

export const NotificationIcon: React.FC<IconProps> = ({ className, color = "#1b1c23", hoverColor }) => {
  return (
    <IconWrapper
      className={className}
      color={color}
      hoverColor={hoverColor}
      viewBox="0 0 20 20"
      width="20"
      height="20"
    >
      <path
        d="M10 2C6.686 2 4 4.686 4 8V13L2 15V16H18V15L16 13V8C16 4.686 13.314 2 10 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 16V17C8 18.1046 8.89543 19 10 19C11.1046 19 12 18.1046 12 17V16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconWrapper>
  );
};

export const DepositIcon: React.FC<IconProps> = ({ className, color = "white", hoverColor }) => {
  return (
    <IconWrapper
      className={className}
      color={color}
      hoverColor={hoverColor}
      viewBox="0 0 17 17"
      width="17"
      height="17"
    >
      <path
        d="M8.5 3V14M8.5 3L13 7.5M8.5 3L4 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconWrapper>
  );
};

export const SendIcon: React.FC<IconProps> = ({ className, color = "white", hoverColor }) => {
  return (
    <IconWrapper
      className={className}
      color={color}
      hoverColor={hoverColor}
      viewBox="0 0 17 17"
      width="17"
      height="17"
    >
      <path
        d="M8.5 14V3M8.5 14L4 9.5M8.5 14L13 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconWrapper>
  );
};

// Componentes que usan los SVGs descargados de Figma como SVG inline para mejor control
export const BarChartIcon: React.FC<IconProps> = ({ className, color = "#8c8fff" }) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      style={{ display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width="20" height="20" rx="6" fill={color} />
      <g transform="translate(4.5, 4.5) scale(1)">
        <path
          d="M1.1582 2.77734C1.79808 2.77734 2.31734 3.29666 2.31738 3.93652V9.2959C2.31738 9.9358 1.79811 10.4541 1.1582 10.4541C0.518504 10.4539 0 9.93565 0 9.2959V3.93652C4.73364e-05 3.29681 0.518533 2.77758 1.1582 2.77734ZM5.50488 0C6.14464 0 6.66284 0.518507 6.66309 1.1582V9.2959C6.66304 9.93576 6.14476 10.4541 5.50488 10.4541C4.86509 10.454 4.34672 9.93571 4.34668 9.2959V1.1582C4.34692 0.518564 4.86521 9.17643e-05 5.50488 0ZM9.85156 5.55566C10.4913 5.55577 11.0096 6.07419 11.0098 6.71387V9.2959C11.0097 9.93569 10.4913 10.454 9.85156 10.4541C9.21173 10.4541 8.69244 9.93573 8.69238 9.2959V6.71387C8.69257 6.07415 9.21181 5.55571 9.85156 5.55566Z"
          fill="white"
        />
      </g>
    </svg>
  );
};

export const FilterIcon: React.FC<IconProps> = ({ className, hoverColor }) => {
  const [hovered, setHovered] = React.useState(false);
  
  return (
    <img
      src="/images/icons/filter-icon.svg"
      alt="Filter"
      className={className}
      style={{
        width: "12px",
        height: "12px",
        filter: hovered && hoverColor ? `drop-shadow(0 0 2px ${hoverColor})` : "none",
        transition: "filter 0.2s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    />
  );
};

export const CrowdfundingIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <img
      src="/images/icons/crowdfunding-icon.svg"
      alt="Crowdfunding"
      className={className}
      style={{ width: "9px", height: "9px" }}
    />
  );
};

export const PersonIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <img
      src="/images/icons/person-icon.svg"
      alt="Person"
      className={className}
      style={{ width: "10px", height: "12px" }}
    />
  );
};

export const ApproveIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 19 19"
      fill="none"
      className={className}
      style={{ display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <circle cx="9.5" cy="9.5" r="9.5" fill="#52E681" />
      <path
        d="M6 9.66667L8.57895 12L13 8"
        stroke="white"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const RejectIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 19 19"
      fill="none"
      className={className}
      style={{ display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <circle cx="9.5" cy="9.5" r="9.5" fill="#1B1C23" />
      <path
        d="M6 6L13 13M13 6L6 13"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const StarIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <img
      src="/images/icons/star-icon.svg"
      alt="Star"
      className={className}
      style={{ width: "15px", height: "15px" }}
    />
  );
};
