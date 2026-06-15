import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';
import { addHours, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScratchCardGridItem } from './scratch/ScratchCardGridItem';

interface Win {
  id: string;
  prize_value: number;
  currency: string;
  reward_type: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  scratch_revealed_at: string | null;
  scratch_percentage: number;
  created_at: string;
  expires_in_hours?: number;
  prize_details?: { name?: string };
  is_partner_prize?: boolean;
  partner_prize?: {
    name: string;
    partner_name: string;
    image_url?: string;
  };
}

interface WinsGalleryGridProps {
  wins: Win[];
  className?: string;
  onScratch?: (cardId: string, percentage: number) => void;
  onReveal?: (cardId: string) => void;
}

export const WinsGalleryGrid: React.FC<WinsGalleryGridProps> = ({
  wins,
  className,
  onScratch = () => {},
  onReveal = () => {}
}) => {
  const [showAll, setShowAll] = useState(false);

  const isCardExpired = (card: Win) => {
    const expiresAt = addHours(new Date(card.created_at), card.expires_in_hours ?? 24);
    return isBefore(expiresAt, new Date());
  };

  const unscratched = wins.filter(w => !w.scratch_revealed_at && w.scratch_percentage < 50 && !isCardExpired(w));
  const revealed = wins.filter(w => w.scratch_revealed_at || w.scratch_percentage >= 50);
  const actualWins = revealed.filter(w => w.reward_type !== 'nothing');
  const losses = revealed.filter(w => w.reward_type === 'nothing' && !isCardExpired(w));

  if (wins.length === 0) {
    return (
      <div className={cn("text-center py-10 px-4", className)}>
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="w-14 h-14 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center"
        >
          <Gift className="h-6 w-6 text-muted-foreground" />
        </motion.div>
        <p className="text-muted-foreground text-sm font-medium">
          Vos cartes apparaîtront ici
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Continuez pour débloquer des cartes
        </p>
      </div>
    );
  }

  const displayedWins = showAll ? actualWins : actualWins.slice(0, 6);
  const displayedLosses = showAll ? losses : losses.slice(0, 4);

  return (
    <div className={cn("px-4 space-y-6", className)}>
      {/* Section: À gratter */}
      {unscratched.length > 0 && (
        <div>
          <motion.h3 
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xs font-semibold text-primary mb-3 uppercase tracking-wider"
          >
            🎟️ À gratter ({unscratched.length})
          </motion.h3>
          <div className="grid grid-cols-1 gap-4">
            {unscratched.map((card) => (
              <ScratchCardGridItem
                key={card.id}
                card={card}
                onScratch={onScratch}
                onReveal={onReveal}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section: Gains récents */}
      {actualWins.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            🎉 Vos gains ({actualWins.length})
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {displayedWins.map((card) => (
              <ScratchCardGridItem
                key={card.id}
                card={card}
                onScratch={onScratch}
                onReveal={onReveal}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section: Tentatives (losses) */}
      {losses.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground/60 mb-3 uppercase tracking-wider">
            Tentatives ({losses.length})
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {displayedLosses.map((card) => (
              <ScratchCardGridItem
                key={card.id}
                card={card}
                onScratch={onScratch}
                onReveal={onReveal}
              />
            ))}
          </div>
        </div>
      )}

      {/* Voir tout button */}
      {(actualWins.length > 6 || losses.length > 4) && (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-4 py-2.5 text-sm text-muted-foreground font-medium rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          {showAll ? 'Voir moins' : `Voir tout (${revealed.length})`}
        </motion.button>
      )}
    </div>
  );
};
