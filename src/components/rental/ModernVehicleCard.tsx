import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, Users, User, Heart, Gauge, Calendar } from 'lucide-react';
import { getCategoryTheme } from '@/utils/categoryThemes';
import { getVehicleImage } from '@/utils/vehicleFallbackImages';
import { formatCurrency } from '@/utils/formatCurrency';

interface ModernVehicleCardProps {
  vehicle: {
    id: string;
    name: string;
    brand: string;
    model: string;
    year: number;
    seats: number;
    transmission: string | null;
    daily_rate: number;
    without_driver_daily_rate: number;
    driver_available: boolean;
    images: string[];
    category_id: string;
  };
  categoryName?: string;
  partnerName?: string;
  partnerLogo?: string;
  index: number;
}

export const ModernVehicleCard: React.FC<ModernVehicleCardProps> = ({
  vehicle,
  categoryName,
  partnerName,
  partnerLogo,
  index,
}) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const dailyRate = vehicle.driver_available && vehicle.without_driver_daily_rate > 0
    ? vehicle.without_driver_daily_rate
    : vehicle.daily_rate;

  const categoryTheme = categoryName ? getCategoryTheme(categoryName) : null;
  const vehicleImage = getVehicleImage(vehicle);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card 
        className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border border-border dark:border-border/60 bg-card dark:bg-card/95 hover:border-border dark:hover:border-border/80"
        onClick={() => navigate(`/rental/${vehicle.id}/details`)}
      >
        {/* Image Hero */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted dark:bg-muted/50">
          {/* Simple placeholder */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted dark:bg-muted/60 animate-pulse" />
          )}

          <img 
            src={vehicleImage}
            alt={vehicle.name}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            {categoryName && categoryTheme && (
              <Badge className="bg-white/95 dark:bg-slate-800/95 text-foreground border-0 shadow-md px-3 py-1">
                <span className="mr-1.5 text-base">{categoryTheme.icon}</span>
                <span className="font-medium">{categoryName}</span>
              </Badge>
            )}
            
            {vehicle.driver_available && (
              <Badge className="bg-emerald-500 dark:bg-emerald-600 text-white border-0 shadow-md px-3 py-1">
                <User className="h-3.5 w-3.5 mr-1.5" />
                <span className="font-medium">Chauffeur</span>
              </Badge>
            )}
          </div>

          {/* Price Card - Bottom left */}
          <div className="absolute bottom-3 left-3">
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-white/20 dark:border-slate-700/50">
              <div className="text-emerald-600 dark:text-emerald-400 font-bold text-lg leading-none">
                {formatCurrency(dailyRate, 'CDF')}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">par jour</div>
            </div>
          </div>

          {/* Favorite button - Bottom right */}
          <Button 
            size="icon" 
            variant="ghost" 
            className={`absolute bottom-3 right-3 rounded-lg shadow-lg transition-colors duration-200 ${
              isLiked 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-700 text-foreground'
            }`}
            onClick={handleLike}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
        </div>

        {/* Info section */}
        <CardContent className="p-4 space-y-3 bg-card dark:bg-card/90">
          {/* Title */}
          <h3 className="font-semibold text-lg line-clamp-1 text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {vehicle.name}
          </h3>

          {/* Specs row */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 bg-muted/50 dark:bg-muted/30 px-2 py-1 rounded-md">
              <Users className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
              <span className="font-medium">{vehicle.seats}</span>
            </span>
            <span className="flex items-center gap-1.5 bg-muted/50 dark:bg-muted/30 px-2 py-1 rounded-md">
              <Gauge className="h-4 w-4 text-teal-500 dark:text-teal-400" />
              <span className="font-medium">{vehicle.transmission === 'automatic' ? 'Auto' : 'Manuel'}</span>
            </span>
            <span className="flex items-center gap-1.5 bg-muted/50 dark:bg-muted/30 px-2 py-1 rounded-md">
              <Calendar className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              <span className="font-medium">{vehicle.year}</span>
            </span>
          </div>

          {/* Partner info */}
          {partnerName && (
            <div className="flex items-center gap-3 pt-3 border-t border-border/50 dark:border-border/30">
              <div className="relative">
                <img 
                  src={partnerLogo || '/placeholder.svg'}
                  alt={partnerName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20 dark:ring-emerald-400/30"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-card" />
              </div>
              <span className="text-sm text-muted-foreground line-clamp-1">{partnerName}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
