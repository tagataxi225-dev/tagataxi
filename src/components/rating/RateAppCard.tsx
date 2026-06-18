/**
 * ⭐ Carte de notation dans le profil
 * - Lien vers le store approprié
 * - Design attrayant
 */

import { motion } from 'framer-motion';
import { Star, ExternalLink, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppRating } from '@/hooks/useAppRating';
import { cn } from '@/lib/utils';

interface RateAppCardProps {
  className?: string;
  compact?: boolean;
}

export const RateAppCard = ({ className, compact = false }: RateAppCardProps) => {
  const { platform, openAppStore, canShowPrompt } = useAppRating();
  const hasRated = !canShowPrompt; // simplified check

  const getStoreInfo = () => {
    switch (platform) {
      case 'ios':
        return { name: 'App Store', icon: '🍎' };
      case 'android':
        return { name: 'Play Store', icon: '🤖' };
      default:
        return { name: 'Store', icon: '⭐' };
    }
  };

  const storeInfo = getStoreInfo();

  if (compact) {
    return (
      <motion.button
        onClick={openAppStore}
        className={cn(
          "w-full p-4 rounded-2xl flex items-center gap-4",
          "bg-gradient-to-r from-yellow-500/10 to-orange-500/10",
          "border border-yellow-500/20 hover:border-yellow-500/40",
          "transition-all group",
          className
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Star className="h-6 w-6 text-white" fill="white" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-semibold text-sm">Noter TAGA</div>
          <div className="text-xs text-muted-foreground">
            {hasRated ? 'Merci pour votre avis !' : `Sur ${storeInfo.name}`}
          </div>
        </div>
        <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/5",
        "border border-yellow-500/20",
        "p-5",
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-orange-400/10 rounded-full blur-xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
            <Heart className="h-7 w-7 text-white" fill="white" />
          </div>
          <div>
            <h3 className="font-bold">Vous aimez TAGA ?</h3>
            <p className="text-sm text-muted-foreground">Votre avis compte !</p>
          </div>
        </div>

        {/* Stars */}
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.div
              key={star}
              whileHover={{ scale: 1.2, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
            >
              <Star 
                className="h-7 w-7 text-yellow-400 cursor-pointer" 
                fill="#facc15"
              />
            </motion.div>
          ))}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4">
          {hasRated 
            ? 'Merci pour votre évaluation ! Vous pouvez modifier votre avis à tout moment.'
            : 'Partagez votre expérience et aidez-nous à améliorer TAGA pour la communauté.'}
        </p>

        {/* Button */}
        <Button
          onClick={openAppStore}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-orange-500/25"
        >
          <Star className="h-5 w-5 mr-2" fill="white" />
          {hasRated ? 'Modifier mon avis' : `Noter sur ${storeInfo.name}`}
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};

export default RateAppCard;
