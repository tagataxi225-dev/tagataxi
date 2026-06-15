import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PartnerTierBadge } from './PartnerTierBadge';
import { usePartnerRentalFollow } from '@/hooks/usePartnerRentalFollow';
import { Car, Star, Heart, ChevronRight, Clock } from 'lucide-react';

interface TopVehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  daily_rate: number;
  images: string[];
}

interface ModernPartnerCardProps {
  partnerId: string;
  partnerName: string;
  partnerLogo: string | null;
  tier: string;
  vehicleCount: number;
  avgRating: number;
  ratingCount: number;
  followersCount: number;
  topVehicles: TopVehicle[];
  index: number;
}

export const ModernPartnerCard: React.FC<ModernPartnerCardProps> = ({
  partnerId,
  partnerName,
  partnerLogo,
  tier,
  vehicleCount,
  avgRating,
  topVehicles,
  index,
}) => {
  const navigate = useNavigate();
  const { isFollowing, followersCount, toggleFollow } = usePartnerRentalFollow(partnerId);
  const hasVehicles = topVehicles.length > 0;

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFollow();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card 
        className="cursor-pointer overflow-hidden border border-border/50 dark:border-border/60 hover:border-primary/30 dark:hover:border-border/80 hover:shadow-md transition-all duration-300 bg-card dark:bg-card/95"
        onClick={() => navigate(`/rental/partner/${partnerId}/shop`)}
      >
        {/* Header compact */}
        <div className="p-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <img 
                src={partnerLogo || '/placeholder.svg'}
                alt={partnerName}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/20 dark:ring-emerald-400/30"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm line-clamp-1 text-foreground">
                  {partnerName}
                </h3>
                <PartnerTierBadge tier={tier} />
              </div>
              
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Car className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span className="font-medium text-foreground">{vehicleCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                  <span className="font-medium text-foreground">
                    {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  <span>{followersCount}</span>
                </div>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleFollow}
              className={`flex-shrink-0 p-2 rounded-xl transition-colors duration-200 ${
                isFollowing
                  ? 'bg-red-50 dark:bg-red-950/50 text-red-500'
                  : 'bg-muted/50 dark:bg-muted/30 text-muted-foreground hover:text-red-500'
              }`}
            >
              <Heart className={`h-5 w-5 transition-all duration-200 ${isFollowing ? 'fill-current scale-110' : ''}`} />
            </motion.button>
          </div>
        </div>

        <CardContent className="p-4 pt-0">
          {hasVehicles ? (
            <>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {topVehicles.slice(0, 3).map((vehicle) => (
                  <div key={vehicle.id} className="flex-shrink-0 w-28 group/thumb">
                    <div className="aspect-[4/3] rounded-xl overflow-hidden mb-1.5 bg-muted dark:bg-muted/50">
                      <img 
                        src={vehicle.images?.[0] || '/placeholder.svg'}
                        alt={vehicle.name}
                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <p className="text-xs font-medium line-clamp-1 text-foreground">{vehicle.name}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      {vehicle.daily_rate.toLocaleString()} CDF
                    </p>
                  </div>
                ))}

                {vehicleCount > 3 && (
                  <div className="flex-shrink-0 w-28 aspect-[4/3] rounded-xl bg-muted/30 dark:bg-muted/20 flex flex-col items-center justify-center border border-dashed border-border dark:border-border/50">
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{vehicleCount - 3}</span>
                    <span className="text-[10px] text-muted-foreground">véhicules</span>
                  </div>
                )}
              </div>

              <Button 
                variant="ghost"
                className="w-full h-9 mt-3 rounded-full text-sm bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-950/80 dark:text-emerald-400 border-0"
              >
                Voir l'agence
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center py-6 rounded-xl bg-muted/30 dark:bg-muted/20 border border-dashed border-border/50">
                <div className="text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                  <p className="text-xs font-medium text-muted-foreground">Bientôt disponible</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">Véhicules en préparation</p>
                </div>
              </div>

              <Button 
                variant="ghost"
                className="w-full h-9 mt-3 rounded-full text-sm bg-muted/50 hover:bg-muted text-muted-foreground border-0"
              >
                Découvrir
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
