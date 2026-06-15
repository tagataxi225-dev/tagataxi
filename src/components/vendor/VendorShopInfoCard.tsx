import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Store, Mail, Calendar, CheckCircle2, Edit, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { VendorSimpleShareButtons } from '@/components/marketplace/VendorSimpleShareButtons';

interface VendorShopInfoCardProps {
  shopName: string;
  description: string;
  email: string;
  totalSales: number;
  rating: number;
  memberSince: string;
  status: 'active' | 'inactive';
  vendorId?: string;
  onEditClick: () => void;
}

export const VendorShopInfoCard: React.FC<VendorShopInfoCardProps> = ({
  shopName,
  description,
  email,
  totalSales,
  rating,
  memberSince,
  status,
  vendorId,
  onEditClick
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        <CardHeader className="relative pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                <Store className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg sm:text-xl truncate">
                    {shopName}
                  </CardTitle>
                  {status === 'active' && (
                    <Badge variant="default" className="gap-1 shrink-0">
                      <CheckCircle2 className="h-3 w-3" />
                      Actif
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {description || "Aucune description"}
                </p>
              </div>
            </div>
            
            {/* Actions buttons - Always visible icons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Bouton partage avec Popover */}
              {vendorId && (
                <>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        title="Partager ma boutique"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="end">
                      <VendorSimpleShareButtons
                        vendorId={vendorId}
                        vendorName={shopName}
                        productCount={totalSales}
                        rating={rating}
                      />
                    </PopoverContent>
                  </Popover>
                </>
              )}
              
              {/* Bouton modifier - Always visible */}
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={onEditClick}
                title="Modifier ma boutique"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="relative space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email de contact
              </p>
              <p className="font-medium text-sm truncate">{email}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Store className="h-4 w-4" />
                Ventes totales
              </p>
              <p className="font-medium">{totalSales} commandes</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Note moyenne</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{rating.toFixed(1)}</span>
                <span className="text-yellow-500">★</span>
                <span className="text-sm text-muted-foreground">/ 5</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Membre depuis
              </p>
              <p className="font-medium text-sm">{memberSince}</p>
            </div>
          </div>
          
          {/* Status Badge Large */}
          <div className="pt-3 border-t">
            <Badge 
              variant={status === 'active' ? 'default' : 'secondary'}
              className="w-full justify-center py-2"
            >
              Statut: {status === 'active' ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
          
          {/* Info régénération lien */}
          {vendorId && (
            <Alert>
              <AlertDescription className="text-xs space-y-2">
                <p>💡 Générez un nouveau lien à chaque partage pour garantir son bon fonctionnement.</p>
                <div className="font-mono text-muted-foreground pt-1">
                  ID: {vendorId.slice(0, 8)}...{vendorId.slice(-8)} ({vendorId.length} car.)
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
