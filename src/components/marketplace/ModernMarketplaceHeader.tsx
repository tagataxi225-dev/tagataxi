import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Heart, ShoppingCart, Search, Package, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ModernMarketplaceHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  cartItemsCount: number;
  onCartClick: () => void;
  onWishlistClick?: () => void;
}

export const ModernMarketplaceHeader = ({
  searchQuery,
  onSearchChange,
  cartItemsCount,
  onCartClick,
  onWishlistClick
}: ModernMarketplaceHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-[60px] z-[140] bg-background/95 backdrop-blur-xl border-b border-primary/20">
      <div className="container max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Logo + Titre avec gradient moderne */}
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-3 bg-gradient-to-br from-primary via-orange-500 to-destructive rounded-2xl shadow-lg shadow-primary/30"
              whileHover={{ rotate: 360, scale: 1.05 }}
              transition={{ duration: 0.5 }}
            >
              <Package className="h-8 w-8 text-white" />
            </motion.div>
            <div className="hidden md:block">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-orange-500 to-destructive bg-clip-text text-transparent">
                TAGA Shop
              </h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 mt-1">
                <Shield className="h-3 w-3 mr-1" />
                Marketplace sécurisé
              </Badge>
            </div>
          </div>

          {/* Barre de recherche centrale */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Rechercher un produit..."
                className="pl-10 bg-muted/50 border-border/50 focus:bg-background"
              />
            </div>
          </div>

          {/* Actions rapides */}
          <div className="flex items-center gap-2">
            {onWishlistClick && (
              <Button variant="ghost" size="icon" onClick={onWishlistClick}>
                <Heart className="h-5 w-5" />
              </Button>
            )}
            
            <Button variant="ghost" size="icon" onClick={onCartClick} className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
