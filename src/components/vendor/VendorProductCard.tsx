import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModerationStatusBadge } from './ModerationStatusBadge';

interface VendorProduct {
  id: string;
  title: string;
  price: number;
  images: string[];
  moderation_status: string;
  status?: string;
  stock_count?: number;
}

interface VendorProductCardProps {
  product: VendorProduct;
  onEdit: (product: VendorProduct) => void;
  onDelete: (productId: string) => void;
  onToggleStatus: (productId: string, isActive: boolean) => void;
}

export const VendorProductCard = ({
  product,
  onEdit,
  onDelete,
  onToggleStatus
}: VendorProductCardProps) => {
  const mainImage = product.images?.[0] || '/placeholder.svg';
  const isActive = product.status === 'active';
  const stockQuantity = product.stock_count || 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // ✅ PHASE 2: Utiliser le badge unifié
  const getStatusBadge = () => {
    return <ModerationStatusBadge status={product.moderation_status} />;
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={cn(
        "overflow-hidden",
        !isActive && "opacity-60"
      )}>
        <div className="relative aspect-square">
          <img 
            src={mainImage}
            alt={product.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 flex flex-col gap-2">
            {getStatusBadge()}
            {stockQuantity === 0 && (
              <Badge variant="destructive">Stock épuisé</Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <h3 className="font-bold text-sm leading-tight line-clamp-2">
            {product.title}
          </h3>

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            <span className="text-xs text-muted-foreground">
              Stock: {stockQuantity}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit(product)}
            >
              <Edit className="h-3 w-3 mr-1" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleStatus(product.id, !isActive)}
            >
              {isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(product.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
