import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  seller: string;
}

interface AnimatedCartItemProps {
  item: CartItem;
  index: number;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string, name: string) => void;
}

export const AnimatedCartItem: React.FC<AnimatedCartItemProps> = ({
  item,
  index,
  onUpdateQuantity,
  onRemove
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = () => {
    console.log('[AnimatedCartItem] Removing item:', item.id, item.name);
    setIsRemoving(true);
    // Appel immédiat de la suppression (l'animation continue visuellement)
    onRemove(item.id, item.name);
  };

  const itemTotal = item.price * item.quantity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: isRemoving ? 0 : 1, 
        x: isRemoving ? 100 : 0,
        scale: isRemoving ? 0.9 : 1
      }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ 
        type: 'spring',
        stiffness: 400,
        damping: 30,
        delay: index * 0.03
      }}
      className="relative group"
    >
      <div className="flex gap-3 py-3 px-1">
        {/* Product image - larger */}
        <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
          {!imageLoaded && (
            <Skeleton className="absolute inset-0" />
          )}
          <img
            src={item.image}
            alt={item.name}
            className={`w-full h-full object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
        </div>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
              <p className="text-xs text-muted-foreground truncate">{item.seller}</p>
            </div>
            
            {/* Delete button */}
            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100"
              aria-label={`Supprimer ${item.name}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-1.5">
            {/* Price */}
            <span className="font-bold text-sm text-foreground">
              {itemTotal.toLocaleString()} CDF
            </span>

            {/* Quantity controls grouped */}
            <div className="flex items-center bg-muted/50 rounded-full px-0.5 py-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="h-7 w-7 p-0 rounded-full hover:bg-background"
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              
              <span className="text-sm font-medium w-6 text-center tabular-nums">
                {item.quantity}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="h-7 w-7 p-0 rounded-full hover:bg-background"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
