import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnimatedTopUpButtonProps {
  onClick: () => Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const AnimatedTopUpButton: React.FC<AnimatedTopUpButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  className
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    setIsProcessing(true);
    try {
      await onClick();
    } finally {
      setIsProcessing(false);
    }
  };

  const isDisabled = disabled || loading || isProcessing;

  return (
    <motion.div
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
    >
      <Button
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          "w-full h-12 rounded-xl font-semibold text-base",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "transition-colors duration-150",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      >
        {loading || isProcessing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Traitement...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Recharger
          </span>
        )}
      </Button>
    </motion.div>
  );
};
