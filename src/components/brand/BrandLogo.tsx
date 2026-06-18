import React from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { ResponsiveImage } from "@/components/common/ResponsiveImage";
import brandLogo from "@/assets/kwenda-logo.png";

interface BrandLogoProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
  animated?: boolean;
  withGlow?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  size = 'md', 
  className, 
  alt,
  animated = false,
  withGlow = false 
}) => {
  // Mapping responsive
  const sizeMap = {
    sm: 48,
    md: 64,
    lg: 80,
    xl: 96
  };
  
  const pixelSize = typeof size === 'number' ? size : sizeMap[size];
  
  // Pour le logo, on utilise des tailles responsive appropriées
  const logoWidths = [48, 64, 80, 96, 128];
  const logoSizes = `${pixelSize}px`;
  
  // On ne peut pas wrapper ResponsiveImage avec motion directement
  // donc on gère l'animation via une div wrapper
  if (animated) {
    return (
      <motion.div
        whileHover={{ scale: 1.1, rotate: 3 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={clsx("inline-block", className)}
      >
        <ResponsiveImage
          src={brandLogo}
          width={pixelSize}
          height={pixelSize}
          alt={alt || "TAGA Taxi Congo — logo"}
          className={clsx(
            "rounded-lg object-contain transition-all duration-300",
            withGlow && "drop-shadow-[0_0_15px_rgba(220,38,38,0.4)]"
          )}
          loading="eager"
          // @ts-ignore - fetchPriority is valid
          fetchPriority="high"
          widths={logoWidths}
          sizes={logoSizes}
          useWebP={true}
        />
      </motion.div>
    );
  }
  
  return (
    <ResponsiveImage
      src={brandLogo}
      width={pixelSize}
      height={pixelSize}
      alt={alt || "TAGA Taxi Congo — logo"}
      className={clsx(
        "rounded-lg object-contain transition-all duration-300",
        withGlow && "drop-shadow-[0_0_15px_rgba(220,38,38,0.4)]",
        className
      )}
      loading="eager"
      // @ts-ignore - fetchPriority is valid
      fetchPriority="high"
      widths={logoWidths}
      sizes={logoSizes}
      useWebP={false}
    />
  );
};

export default BrandLogo;
