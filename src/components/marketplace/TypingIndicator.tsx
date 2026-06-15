import React from 'react';
import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  sellerName?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ sellerName = 'Vendeur' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 p-3 bg-muted rounded-lg max-w-xs"
    >
      <div className="flex gap-1">
        <motion.div
          className="w-2 h-2 bg-primary rounded-full"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-2 h-2 bg-primary rounded-full"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="w-2 h-2 bg-primary rounded-full"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
        />
      </div>
      <span className="text-sm text-muted-foreground">
        {sellerName} est en train d'écrire...
      </span>
    </motion.div>
  );
};
