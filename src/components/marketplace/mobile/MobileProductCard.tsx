import React from 'react';
import { Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TouchOptimizedInterface, SwipeableCard } from '@/components/mobile/TouchOptimizedInterface';

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  status: string;
  images: string[];
}

interface MobileProductCardProps {
  product: Product;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string, currentStatus: string) => void;
}

export const MobileProductCard: React.FC<MobileProductCardProps> = ({
  product,
  onView,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  const imageUrl = Array.isArray(product.images) && product.images.length > 0 
    ? product.images[0] 
    : 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=100&h=100&fit=crop';

  const handleSwipeLeft = () => {
    if (onEdit) onEdit(product.id);
  };

  const handleSwipeRight = () => {
    if (onDelete) onDelete(product.id);
  };

  return (
    <SwipeableCard 
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
      className="mb-3"
    >
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            {/* Image */}
            <div className="relative flex-shrink-0">
              <img
                src={imageUrl}
                alt={product.title}
                className="w-20 h-20 object-cover"
                loading="lazy"
              />
              {product.status !== 'active' && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-xs">Inactif</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-3 min-w-0">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm truncate">{product.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{product.category}</p>
                  <p className="font-semibold text-primary text-sm mt-1">
                    {product.price.toLocaleString()} CDF
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge 
                    variant={product.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {product.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(product.id)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Voir
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(product.id)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem 
                          onClick={() => onDelete(product.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Switch pour le statut */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">Status actif</span>
                <TouchOptimizedInterface>
                  <Switch
                    checked={product.status === 'active'}
                    onCheckedChange={() => onToggleStatus?.(product.id, product.status)}
                  />
                </TouchOptimizedInterface>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </SwipeableCard>
  );
};