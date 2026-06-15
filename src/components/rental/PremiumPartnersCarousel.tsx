import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PartnerTierBadge } from './PartnerTierBadge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Crown, Star, Car, ChevronRight } from 'lucide-react';

interface PremiumPartner {
  partnerId: string;
  partnerName: string;
  partnerLogo: string | null;
  tier: string;
  vehicleCount: number;
  avgRating: number;
  topVehicles: Array<{ id: string; images: string[] }>;
}

interface PremiumPartnersCarouselProps {
  premiumPartners: PremiumPartner[];
}

export const PremiumPartnersCarousel: React.FC<PremiumPartnersCarouselProps> = ({
  premiumPartners,
}) => {
  const navigate = useNavigate();

  if (premiumPartners.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4">
      {/* Header avec titre animé */}
      <motion.div 
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-amber-500/30"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          >
            <Crown className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Partenaires Premium
            </h2>
            <p className="text-xs text-muted-foreground">Agences vérifiées et recommandées</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
          onClick={() => navigate('/rental')}
        >
          Voir tout
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </motion.div>

      {/* Carousel premium */}
      <Carousel className="w-full">
        <CarouselContent className="-ml-3">
          {premiumPartners.map((partner, index) => (
            <CarouselItem 
              key={partner.partnerId} 
              className="pl-3 basis-full md:basis-1/2 lg:basis-1/3"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <Card 
                  className="relative overflow-hidden h-44 cursor-pointer group border-2 border-amber-500/20 hover:border-amber-500/50 transition-all duration-500"
                  onClick={() => navigate(`/rental/partner/${partner.partnerId}/shop`)}
                >
                  {/* Background image avec effet parallax */}
                  <div className="absolute inset-0">
                    <motion.img 
                      src={partner.topVehicles[0]?.images?.[0] || '/placeholder.svg'}
                      alt={partner.partnerName}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30" />
                  </div>

                  {/* Tier badge floating */}
                  <div className="absolute top-3 right-3">
                    <PartnerTierBadge tier={partner.tier} className="shadow-xl" />
                  </div>

                  {/* Content */}
                  <CardContent className="relative z-10 p-4 h-full flex flex-col justify-end">
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <img 
                          src={partner.partnerLogo || '/placeholder.svg'}
                          alt={partner.partnerName}
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/30"
                        />
                        <motion.div
                          className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-black flex items-center justify-center"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </motion.div>
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg line-clamp-1">
                          {partner.partnerName}
                        </h3>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-white/90 text-sm">
                      <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1">
                        <Car className="h-3.5 w-3.5" />
                        <span className="font-semibold">{partner.vehicleCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1">
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        >
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        </motion.div>
                        <span className="font-semibold">{partner.avgRating.toFixed(1)}</span>
                      </div>
                    </div>
                  </CardContent>

                  {/* Hover glow effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 to-transparent" />
                  </div>
                </Card>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 bg-background/80 backdrop-blur-sm border-2 hover:bg-background hover:border-amber-500/50" />
        <CarouselNext className="right-2 bg-background/80 backdrop-blur-sm border-2 hover:bg-background hover:border-amber-500/50" />
      </Carousel>
    </div>
  );
};
