import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, MessageCircle, Star, ShieldCheck, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface SellerInfoCardProps {
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  sellerRating: number;
  totalSales: number;
  productCount?: number;
  responseRate?: number;
}

export const SellerInfoCard: React.FC<SellerInfoCardProps> = ({
  sellerId,
  sellerName,
  sellerAvatar,
  sellerRating,
  totalSales,
  productCount = 0,
  responseRate = 95
}) => {
  const navigate = useNavigate();

  const handleVisitShop = () => {
    navigate(`/marketplace/shop/${sellerId}`);
  };

  const handleStartChat = () => {
    toast.info('Chat avec le vendeur à venir');
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Profil vendeur cliquable */}
        <div 
          className="flex items-center gap-3 hover:bg-muted/30 p-2 rounded-lg transition-colors cursor-pointer"
          onClick={handleVisitShop}
        >
          <img 
            src={sellerAvatar || '/placeholder.svg'}
            alt={sellerName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium line-clamp-1">{sellerName}</p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <span>{sellerRating.toFixed(1)}</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>
        
        {/* Stats inline */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium">{productCount} produits</span>
          <span>•</span>
          <span className="font-medium">{totalSales} ventes</span>
          <span>•</span>
          <span className="font-medium text-green-600">{responseRate}% réponses</span>
        </div>
        
        {/* Bouton CTA */}
        <Button 
          variant="outline" 
          size="sm"
          className="w-full"
          onClick={handleVisitShop}
        >
          <Store className="h-3 w-3 mr-2" />
          Visiter la boutique
        </Button>
      </CardContent>
    </Card>
  );
};
