import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface YangoProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    image: string;
    isNew: boolean;
    stockCount: number;
  };
  isFavorite: boolean;
  onAddToCart: () => void;
  onToggleFavorite: () => void;
}

export const YangoProductCard: React.FC<YangoProductCardProps> = ({
  product,
  isFavorite,
  onAddToCart,
  onToggleFavorite
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 border-0"
      onClick={product.stockCount > 0 ? onAddToCart : undefined}
    >
      {/* Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {/* Image avec skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-pulse" />
        )}
        <img
          src={product.image}
          alt={product.title}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        
        {/* Badge NOUVEAUTÉ */}
        {product.isNew && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-2 left-2 bg-green-500 text-white px-2 py-0.5 text-[10px] font-bold rounded shadow-md"
          >
            NOUVEAUTÉ
          </motion.div>
        )}
        
        {/* Icône Coeur Favoris */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/95 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-background transition-colors"
        >
          <Heart
            className={`h-4 w-4 transition-all ${
              isFavorite 
                ? 'fill-red-500 text-red-500' 
                : 'text-gray-600'
            }`}
          />
        </motion.button>

        {/* Overlay Rupture de Stock */}
        {product.stockCount === 0 && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-background/95 px-4 py-2 rounded-lg">
              <span className="text-foreground font-bold text-sm">Rupture de stock</span>
            </div>
          </div>
        )}
      </div>

      {/* Info Produit */}
      <CardContent className="p-3 space-y-1">
        {/* Prix */}
        <div className="text-xl font-bold text-foreground">
          {product.price.toLocaleString('fr-FR')} F
        </div>
        
        {/* Titre */}
        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
          {product.title}
        </h3>
      </CardContent>
    </Card>
  );
};
