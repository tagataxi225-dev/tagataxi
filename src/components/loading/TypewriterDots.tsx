import { motion } from "framer-motion";

/**
 * 💬 POINTS ANIMÉS TYPEWRITER
 * Animation de 3 points qui apparaissent séquentiellement
 * Effet "typing" pour les messages de chargement
 */
export const TypewriterDots = () => {
  return (
    <span className="inline-flex gap-0.5 ml-0.5" aria-hidden="true">
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ 
          duration: 1.2, 
          repeat: Infinity, 
          delay: 0,
          ease: "easeInOut"
        }}
        className="text-muted-foreground"
      >
        .
      </motion.span>
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ 
          duration: 1.2, 
          repeat: Infinity, 
          delay: 0.4,
          ease: "easeInOut"
        }}
        className="text-muted-foreground"
      >
        .
      </motion.span>
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ 
          duration: 1.2, 
          repeat: Infinity, 
          delay: 0.8,
          ease: "easeInOut"
        }}
        className="text-muted-foreground"
      >
        .
      </motion.span>
    </span>
  );
};
