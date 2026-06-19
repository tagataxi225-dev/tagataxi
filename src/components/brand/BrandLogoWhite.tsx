import React from "react";
import clsx from "clsx";
import tagaLogo from "@/assets/LOGO_TAGA.png";

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
    <img
      src={tagaLogo}
      width={size}
      height={size}
      alt={alt || "TAGA Logo"}
      className={clsx("rounded-lg object-contain drop-shadow-2xl", className)}
      loading="eager"
      decoding="async"
    />
  );
};

export default BrandLogoWhite;
