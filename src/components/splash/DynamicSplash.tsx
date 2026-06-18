import React from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { getStartupContext, StartupContext } from "@/services/startupContext";
import BrandLogo from "@/components/brand/BrandLogo";

interface DynamicSplashProps {
  context?: StartupContext;
}

export const DynamicSplash: React.FC<DynamicSplashProps> = ({ context }) => {
  const location = useLocation();
  const ctx = context || getStartupContext(location.pathname);

  return (
    <motion.div 
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{
        background: "#000000"
      }}
    >
      {/* Lueurs statiques simplifiées */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-[40px]"
        style={{ background: 'rgba(236, 32, 39, 0.08)' }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full blur-[40px]"
        style={{ background: 'rgba(236, 32, 39, 0.06)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      {/* Particules optimisées - Réduites à 6 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => {
          const size = 40 + Math.random() * 20;
          const duration = 2.5 + Math.random();
          const delay = Math.random();
          return (
            <motion.div
              key={i}
              className="absolute rounded-full bg-red-500/5"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -15, 0],
                opacity: [0.1, 0.25, 0.1],
                scale: [0.9, 1.1, 0.9],
              }}
              transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
            />
          );
        })}
      </div>

      {/* Contenu central */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 150,
          damping: 20,
          duration: 0.6
        }}
        className="relative z-10 flex items-center justify-center"
      >
        {/* Logo avec halo subtil */}
        <div className="relative">
          <motion.div
            className="absolute -inset-12 rounded-full blur-[40px]"
            style={{ background: 'rgba(236, 32, 39, 0.12)' }}
            animate={{ 
              scale: [0.95, 1.05, 0.95],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            animate={{ 
              scale: [1, 1.03, 1],
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <BrandLogo size={224} className="drop-shadow-2xl relative z-10 filter brightness-110" alt="TAGA Logo" />
          </motion.div>
        </div>

      </motion.div>
    </motion.div>
  );
};

export default DynamicSplash;
