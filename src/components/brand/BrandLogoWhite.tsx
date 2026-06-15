import React from "react";
import clsx from "clsx";

interface BrandLogoWhiteProps {
  size?: number;
  className?: string;
  alt?: string;
}

export const BrandLogoWhite: React.FC<BrandLogoWhiteProps> = ({ 
  size = 64, 
  className, 
  alt 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx("drop-shadow-2xl", className)}
      aria-label={alt || "Tembea Logo"}
    >
      {/* Cercle de fond */}
      <circle cx="100" cy="100" r="95" fill="white" fillOpacity="0.95"/>
      
      {/* Logo K stylisé en rouge */}
      <g transform="translate(60, 50)">
        <path
          d="M 0,0 L 0,100 M 40,0 L 0,50 M 0,50 L 50,100"
          stroke="#DC2626"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
      
      {/* Texte KWENDA */}
      <text
        x="100"
        y="165"
        fontFamily="Arial, sans-serif"
        fontSize="24"
        fontWeight="bold"
        fill="#DC2626"
        textAnchor="middle"
        letterSpacing="2"
      >
        KWENDA
      </text>
    </svg>
  );
};

export default BrandLogoWhite;
