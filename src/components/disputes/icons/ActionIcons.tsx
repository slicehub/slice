import React from "react";

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Deposit Icon - Círculo con gradiente y flecha hacia abajo
 * Optimizado para escalado sin pérdida de calidad
 * Tamaño visual: ajustar size para coincidir con el diseño
 */
export const DepositIcon: React.FC<IconProps> = ({ className, size = 40.515 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 41 41"
      fill="none"
      className={className}
      style={{ display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="depositGradient" x1="20.2572" y1="0" x2="20.2572" y2="40.5146" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8C8FFF" />
          <stop offset="1" stopColor="#7EB5FD" />
        </linearGradient>
      </defs>
      <circle cx="20.2572" cy="20.2573" r="20.2573" fill="url(#depositGradient)" />
      <path
        d="M20 29L25 24M20 29L15 24M20 29V11"
        stroke="#1B1C23"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Send Icon - Círculo blanco con flecha hacia arriba
 * Optimizado para escalado sin pérdida de calidad
 * Tamaño visual: ajustar size para coincidir con el diseño
 */
export const SendIcon: React.FC<IconProps> = ({ className, size = 40.515 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 41 41"
      fill="none"
      className={className}
      style={{ display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <circle cx="20.2573" cy="20.2573" r="20.2573" fill="#EFF1F5" />
      <path
        d="M20 11.7573L25 16.7573M20 11.7573L15 16.7573M20 11.7573V29.7573"
        stroke="#1B1C23"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

