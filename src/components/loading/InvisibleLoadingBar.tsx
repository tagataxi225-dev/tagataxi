import { motion } from "framer-motion";

/**
 * 🚀 BARRE DE CHARGEMENT INVISIBLE
 * Indicateur discret (2px) en haut de l'écran
 * Disparaît automatiquement après 800ms
 */
export const InvisibleLoadingBar = () => {
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-0.5 bg-primary shadow-lg shadow-primary/20 z-[100]"
      initial={{ width: "0%" }}
      animate={{ 
        width: ["0%", "70%", "100%"],
        opacity: [1, 1, 0]
      }}
      transition={{ 
        width: { duration: 0.8, ease: "easeOut" },
        opacity: { duration: 0.2, delay: 0.6 }
      }}
      style={{
        willChange: 'width, opacity',
        transform: 'translateZ(0)'
      }}
    />
  );
};
