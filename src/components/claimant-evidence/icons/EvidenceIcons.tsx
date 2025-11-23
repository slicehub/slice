import React from "react";

interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

/**
 * Picture Icon - Icono de imagen
 */
export const PictureIcon: React.FC<IconProps> = ({ className, size = 10, color = "#1b1c23" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      fill="none"
      className={className}
      style={{ display: "block" }}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.33333 0H1.66667C0.746192 0 0 0.746192 0 1.66667V8.33333C0 9.25381 0.746192 10 1.66667 10H8.33333C9.25381 10 10 9.25381 10 8.33333V1.66667C10 0.746192 9.25381 0 8.33333 0ZM1.66667 1.66667H8.33333V6.66667L6.66667 5L5 6.66667L3.33333 5L1.66667 6.66667V1.66667Z"
        fill={color}
      />
    </svg>
  );
};

/**
 * Fullscreen Icon - Fullscreen icon (two arrows exiting a square)
 */
export const FullscreenIcon: React.FC<IconProps> = ({
  className,
  size = 16,
  color = "#1b1c23",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      style={{ display: "block" }}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 2H2V5M11 2H14V5M5 14H2V11M11 14H14V11"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 5L5 2M14 5L11 2M2 11L5 14M14 11L11 14"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Play Icon - Icono de play para videos
 */
export const PlayIcon: React.FC<IconProps> = ({ className, size = 37, color = "#1b1c23" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 37 37"
      fill="none"
      className={className}
      style={{ display: "block" }}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="18.5" cy="18.5" r="18.5" fill="white" fillOpacity="0.9" />
      <path
        d="M14 11L26 18.5L14 26V11Z"
        fill={color}
      />
    </svg>
  );
};

/**
 * Microphone Icon - Icono de micrófono para audios
 */
export const MicrophoneIcon: React.FC<IconProps> = ({
  className,
  size = 35,
  color = "#1b1c23",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 35 35"
      fill="none"
      className={className}
      style={{ display: "block" }}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.5 21.875C20.3995 21.875 22.75 19.5245 22.75 16.625V7.29167C22.75 4.39217 20.3995 2.04167 17.5 2.04167C14.6005 2.04167 12.25 4.39217 12.25 7.29167V16.625C12.25 19.5245 14.6005 21.875 17.5 21.875Z"
        fill={color}
      />
      <path
        d="M24.7917 16.625C24.7917 20.8333 21.3333 24.2917 17.125 24.2917C12.9167 24.2917 9.45833 20.8333 9.45833 16.625H7.29167C7.29167 21.875 11.375 26.25 16.625 26.875V30.625H18.375V26.875C23.625 26.25 27.7083 21.875 27.7083 16.625H24.7917Z"
        fill={color}
      />
    </svg>
  );
};
