import { motion, Variants } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Clock } from 'lucide-react';
import type { Restaurant } from '@/types/food';

interface NewRestaurantsSectionProps {
  restaurants: Restaurant[];
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onViewAll?: () => void;
}

// Animation stagger pour les cards
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardVariants: Variants = {
  hidden: { 
    y: 30, 
    opacity: 0,
    scale: 0.9
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { 
      type: 'spring' as const,
      stiffness: 100,
      damping: 15
    }
  }
};

export const NewRestaurantsSection = ({ 
  restaurants, 
  onSelectRestaurant,
  onViewAll 
}: NewRestaurantsSectionProps) => {
  if (restaurants.length === 0) return null;

  return (
    <div className="space-y-6 px-4 py-6">
      {/* Header avec gradient */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            🆕 Nouveaux Restaurants
          </h2>
          <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full text-sm font-semibold animate-pulse">
            {restaurants.length}
          </span>
        </div>
        {onViewAll && restaurants.length > 6 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onViewAll}
            className="text-primary hover:text-primary/80 font-semibold"
          >
            Voir tout →
          </Button>
        )}
      </div>

      {/* Grid layout moderne */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {restaurants.slice(0, 6).map((restaurant) => (
          <motion.div
            key={restaurant.id}
            variants={cardVariants}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
          >
            <Card 
              className="relative overflow-hidden cursor-pointer group h-full flex flex-col"
              onClick={() => onSelectRestaurant(restaurant)}
            >
              {/* Badge NOUVEAU animé */}
              <div className="absolute top-2 right-2 z-10">
                <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-lg animate-bounce">
                  NOUVEAU
                </Badge>
              </div>

              {/* Image avec overlay gradient */}
              <div className="relative h-32 sm:h-40 overflow-hidden">
                <motion.img
                  src={restaurant.banner_url || '/placeholder.svg'}
                  alt={restaurant.restaurant_name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Logo en bas à gauche de l'image */}
                {restaurant.logo_url && (
                  <div className="absolute bottom-2 left-2">
                    <div className="w-12 h-12 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white">
                      <img
                        src={restaurant.logo_url}
                        alt={`${restaurant.restaurant_name} logo`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Contenu de la card */}
              <div className="p-3 flex-1 flex flex-col">
                {/* Nom du restaurant */}
                <h3 className="font-bold text-sm sm:text-base line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                  {restaurant.restaurant_name}
                </h3>

                {/* Infos : Rating + Temps */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  {restaurant.rating_average && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-foreground">
                        {restaurant.rating_average.toFixed(1)}
                      </span>
                    </div>
                  )}
                  {restaurant.average_preparation_time && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{restaurant.average_preparation_time} min</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Indicateur "Ouvert maintenant" - basé sur is_active */}
                {restaurant.is_active && (
                  <div className="mt-auto">
                    <Badge 
                      variant="outline" 
                      className="text-xs border-green-500/50 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                      Ouvert
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Bouton "Voir tous les restaurants" si plus de 6 */}
      {onViewAll && restaurants.length > 6 && (
        <div className="flex justify-center pt-2">
          <Button 
            onClick={onViewAll}
            variant="outline"
            size="lg"
            className="group hover:border-primary hover:text-primary transition-all"
          >
            Voir tous les {restaurants.length} restaurants
            <motion.span
              className="ml-2"
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              →
            </motion.span>
          </Button>
        </div>
      )}
    </div>
  );
};
