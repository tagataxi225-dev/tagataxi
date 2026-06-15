import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Eye, Copy, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';

interface ModernProductCardProps {
  id: string;
  image: string;
  title: string;
  category: string;
  price: number;
  status: 'approved' | 'pending' | 'rejected';
  stock: number;
  onClick?: () => void;
  onEdit?: () => void;
  onView?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

const statusConfig = {
  approved: { label: 'Actif', variant: 'default' as const, color: 'bg-green-500' },
  pending: { label: 'En attente', variant: 'secondary' as const, color: 'bg-orange-500' },
  rejected: { label: 'Rejeté', variant: 'destructive' as const, color: 'bg-red-500' },
};

export const ModernProductCard: React.FC<ModernProductCardProps> = ({
  id,
  image,
  title,
  category,
  price,
  status,
  stock,
  onClick,
  onEdit,
  onView,
  onDuplicate,
  onDelete
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const statusInfo = statusConfig[status];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden group cursor-pointer" onClick={onClick}>
        <div className="relative aspect-square bg-muted">
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-muted" />
          )}
          <img
            src={image}
            alt={title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Status Badge Overlay */}
          <div className="absolute top-2 left-2">
            <Badge variant={statusInfo.variant} className="text-xs">
              {statusInfo.label}
            </Badge>
          </div>

          {/* Quick Actions Overlay */}
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView?.(); }}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }}>
                  <Copy className="h-4 w-4 mr-2" />
                  Dupliquer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                  className="text-red-600"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stock Low Warning */}
          {stock < 5 && stock > 0 && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="destructive" className="text-xs">
                Stock bas: {stock}
              </Badge>
            </div>
          )}
        </div>

        <div className="p-3 space-y-1">
          <p className="text-xs text-muted-foreground">{category}</p>
          <h3 className="font-semibold line-clamp-2 text-sm">{title}</h3>
          <p className="text-lg font-bold text-red-600">{price.toLocaleString()} CDF</p>
        </div>
      </Card>
    </motion.div>
  );
};
