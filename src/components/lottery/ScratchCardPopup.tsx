import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { TembeaGrattaWin } from '@/types/kwenda-gratta';
import { ScratchTicket } from './scratch/ScratchTicket';

interface ScratchCardPopupProps {
  card: TembeaGrattaWin | null;
  isOpen: boolean;
  onClose: () => void;
  onScratch: (percentage: number) => void;
  onReveal: () => void;
}

export const ScratchCardPopup: React.FC<ScratchCardPopupProps> = ({
  card,
  isOpen,
  onClose,
  onScratch,
  onReveal
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    if (card) {
      setIsRevealed(false);
    }
  }, [card?.id]);

  const handleReveal = () => {
    setIsRevealed(true);
    onReveal();
  };

  const handleClose = () => {
    setIsRevealed(false);
    onClose();
  };

  if (!card) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          {/* Header avec bouton retour */}
          <div className="flex items-center px-4 py-3 border-b border-border/30">
            <button 
              onClick={handleClose}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Retour</span>
            </button>
          </div>

          {/* Carte centrée */}
          <div 
            className="flex-1 flex items-center justify-center px-4"
            style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
          >
            <div className="w-full max-w-[340px]">
              <ScratchTicket
                card={card}
                onScratch={onScratch}
                onReveal={handleReveal}
                onClose={handleClose}
                showCloseButton={false}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
