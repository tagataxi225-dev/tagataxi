import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface MarketplaceProductHeaderProps {
  title: string;
  cartCount?: number;
  onCartClick: () => void;
}

export const MarketplaceProductHeader: React.FC<MarketplaceProductHeaderProps> = ({
  title,
  cartCount = 0,
  onCartClick
}) => {
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = React.useState(false);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/marketplace');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: title,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié dans le presse-papiers');
    }
  };

  const handleToggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Retiré des favoris' : 'Ajouté aux favoris');
  };

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/60 shadow-sm pt-safe-top">
      <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center gap-2 sm:gap-3">
        {/* Back button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 sm:h-10 sm:w-10"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        {/* Title */}
        <div className="flex-1 min-w-0 text-center px-2">
          <h1 className="text-sm sm:text-base font-semibold line-clamp-1">
            {title}
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Wishlist */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 sm:h-10 sm:w-10"
            onClick={handleToggleWishlist}
          >
            <Heart className={`h-5 w-5 transition-colors ${isWishlisted ? 'fill-destructive text-destructive' : ''}`} />
          </Button>
          
          {/* Share */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 sm:h-10 sm:w-10"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
          
          {/* Cart */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 sm:h-10 sm:w-10 relative"
            onClick={onCartClick}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1"
              >
                <Badge className="h-5 min-w-[20px] rounded-full bg-destructive text-white text-xs px-1">
                  {cartCount}
                </Badge>
              </motion.div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
