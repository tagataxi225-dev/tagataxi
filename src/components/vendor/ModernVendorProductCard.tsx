import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Edit, Clock, CheckCircle, XCircle, Package, Trash2, AlertTriangle, Archive, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { redis } from '@/lib/redis';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

interface ModernVendorProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    images?: string[];
    stock_count?: number;
    moderation_status: string;
    rejection_reason?: string;
    status?: string;
  };
  onDelete?: () => void;
}

export const ModernVendorProductCard = ({ product, onDelete }: ModernVendorProductCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [editingStock, setEditingStock] = useState(false);
  const [stockValue, setStockValue] = useState(product.stock_count || 0);
  const [updatingStock, setUpdatingStock] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [canDelete, setCanDelete] = useState<boolean | null>(null);
  const [checkingDependencies, setCheckingDependencies] = useState(false);

  const isLowStock = (product.stock_count || 0) < 5;
  const isOutOfStock = (product.stock_count || 0) === 0;
  const isArchived = product.status === 'inactive';

  // Validation et mise à jour du stock
  const handleUpdateStock = async () => {
    // Validation stricte
    if (isNaN(stockValue) || stockValue < 0 || !Number.isInteger(stockValue)) {
      toast({
        title: "❌ Stock invalide",
        description: "Le stock doit être un nombre entier positif ou zéro",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "❌ Non connecté",
        description: "Vous devez être connecté pour modifier le stock",
        variant: "destructive"
      });
      return;
    }

    try {
      setUpdatingStock(true);

      const { error } = await supabase
        .from('marketplace_products')
        .update({ stock_count: stockValue })
        .eq('id', product.id)
        .eq('seller_id', user.id); // Sécurité supplémentaire

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Erreur base de données');
      }

      toast({
        title: "✅ Stock mis à jour",
        description: `Nouveau stock : ${stockValue} unités`
      });

      setEditingStock(false);
      onDelete?.(); // Rafraîchir la liste
    } catch (error: any) {
      console.error('Error updating stock:', error);
      toast({
        title: "❌ Erreur",
        description: error.message || "Impossible de mettre à jour le stock",
        variant: "destructive"
      });
    } finally {
      setUpdatingStock(false);
    }
  };

  // Archiver le produit (soft delete - toujours possible)
  const handleArchive = async () => {
    if (!user) return;

    try {
      setArchiving(true);

      const newStatus = isArchived ? 'active' : 'inactive';
      const { error } = await supabase
        .from('marketplace_products')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id)
        .eq('seller_id', user.id);

      if (error) {
        console.error('Archive error:', error);
        throw new Error(error.message);
      }

      toast({
        title: isArchived ? "✅ Produit réactivé" : "📦 Produit archivé",
        description: isArchived 
          ? "Le produit est de nouveau visible dans la boutique"
          : "Le produit n'est plus visible dans la boutique"
      });

      // Invalider tous les caches marketplace
      await redis.invalidatePattern('products:popular');
      await redis.invalidatePattern('product');
      queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
      queryClient.invalidateQueries({ queryKey: ['all-marketplace-products'] });

      onDelete?.();
    } catch (error: any) {
      console.error('Error archiving product:', error);
      toast({
        title: "❌ Erreur",
        description: error.message || "Impossible d'archiver le produit",
        variant: "destructive"
      });
    } finally {
      setArchiving(false);
    }
  };

  // Vérifier si le produit peut être supprimé définitivement
  const checkCanDelete = async () => {
    setCheckingDependencies(true);
    try {
      // Vérifier les dépendances (commandes, conversations, etc.)
      const [ordersResult, conversationsResult] = await Promise.all([
        supabase
          .from('marketplace_orders')
          .select('id', { count: 'exact', head: true })
          .eq('product_id', product.id),
        supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('product_id', product.id)
      ]);

      const hasOrders = (ordersResult.count || 0) > 0;
      const hasConversations = (conversationsResult.count || 0) > 0;
      
      setCanDelete(!hasOrders && !hasConversations);
      setShowDeleteConfirm(true);
    } catch (error) {
      console.error('Error checking dependencies:', error);
      // En cas d'erreur, on assume qu'il y a des dépendances
      setCanDelete(false);
      setShowDeleteConfirm(true);
    } finally {
      setCheckingDependencies(false);
    }
  };

  // Suppression définitive
  const handleDelete = async () => {
    if (!user) return;

    try {
      setDeleting(true);

      const { error } = await supabase
        .from('marketplace_products')
        .delete()
        .eq('id', product.id)
        .eq('seller_id', user.id);

      if (error) {
        console.error('Delete error:', error);
        
        // Si erreur FK, proposer l'archivage
        if (error.code === '23503' || error.message?.includes('foreign key')) {
          toast({
            title: "⚠️ Suppression impossible",
            description: "Ce produit a des commandes ou conversations liées. Utilisez l'archivage à la place.",
            variant: "destructive"
          });
          return;
        }
        
        throw new Error(error.message);
      }

      toast({
        title: "✅ Produit supprimé",
        description: "Le produit a été supprimé définitivement"
      });

      setShowDeleteConfirm(false);
      onDelete?.();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "❌ Erreur",
        description: error.message || "Impossible de supprimer le produit",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = () => {
    if (isArchived) {
      return (
        <Badge variant="secondary" className="bg-gray-500 text-white border-0">
          <Archive className="h-3 w-3 mr-1" />
          Archivé
        </Badge>
      );
    }

    const isPending = product.moderation_status === 'pending';
    const isApproved = product.moderation_status === 'approved' || product.moderation_status === 'active';
    const isRejected = product.moderation_status === 'rejected';

    if (isPending) {
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0">
          <Clock className="h-3 w-3 mr-1" />
          En attente
        </Badge>
      );
    }

    if (isApproved) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">
          <CheckCircle className="h-3 w-3 mr-1" />
          Actif
        </Badge>
      );
    }

    if (isRejected) {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Rejeté
        </Badge>
      );
    }

    return null;
  };

  return (
    <Card className={`relative overflow-hidden bg-card/80 backdrop-blur-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${isArchived ? 'opacity-60' : ''}`}>
      {/* Image */}
      <div className="relative h-48 bg-muted/50">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground/20" />
          </div>
        )}
        
        {/* Badge statut en overlay */}
        <div className="absolute top-4 left-4">
          {getStatusBadge()}
        </div>
      </div>
      
      {/* Contenu */}
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-lg line-clamp-2 mb-2">{product.title}</h3>
          
          {/* Prix en rouge vif */}
          <p className="text-2xl font-bold text-destructive">
            {product.price.toLocaleString()} CDF
          </p>
        </div>
        
        {/* Stock avec édition inline */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {editingStock ? (
              <>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={stockValue}
                  onChange={(e) => setStockValue(parseInt(e.target.value) || 0)}
                  className="h-8 w-24"
                  disabled={updatingStock}
                />
                <Button
                  size="sm"
                  onClick={handleUpdateStock}
                  disabled={updatingStock}
                  className="h-8"
                >
                  {updatingStock ? <Loader2 className="h-4 w-4 animate-spin" /> : 'OK'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingStock(false);
                    setStockValue(product.stock_count || 0);
                  }}
                  className="h-8"
                  disabled={updatingStock}
                >
                  ✕
                </Button>
              </>
            ) : (
              <>
                <p className={`text-sm font-medium ${
                  isOutOfStock ? 'text-destructive' : 
                  isLowStock ? 'text-orange-500' : 
                  'text-muted-foreground'
                }`}>
                  Stock: {product.stock_count || 0}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingStock(true)}
                  className="h-6 px-2 text-xs"
                >
                  Modifier
                </Button>
              </>
            )}
          </div>
          
          {/* Alertes stock */}
          {isOutOfStock && (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3" />
              <span>Rupture de stock</span>
            </div>
          )}
          {isLowStock && !isOutOfStock && (
            <div className="flex items-center gap-1 text-xs text-orange-500">
              <AlertTriangle className="h-3 w-3" />
              <span>Stock faible</span>
            </div>
          )}
        </div>

        {/* Raison de rejet si applicable */}
        {product.moderation_status === 'rejected' && product.rejection_reason && (
          <div className="p-2 bg-destructive/10 rounded-md text-xs text-destructive">
            <strong>Raison:</strong> {product.rejection_reason}
          </div>
        )}
        
        {/* Boutons Actions */}
        <div className="flex gap-2">
          <Button 
            variant="default" 
            className="flex-1 bg-foreground text-background hover:bg-foreground/90"
            onClick={() => navigate(`/vendeur/modifier-produit/${product.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>

          {/* Bouton Archiver/Réactiver */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleArchive}
            disabled={archiving}
            title={isArchived ? "Réactiver" : "Archiver"}
          >
            {archiving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
          </Button>

          {/* Bouton Supprimer */}
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="icon"
                disabled={deleting || checkingDependencies}
                onClick={(e) => {
                  e.preventDefault();
                  checkCanDelete();
                }}
              >
                {checkingDependencies ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {canDelete ? "Supprimer définitivement ?" : "Suppression impossible"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {canDelete ? (
                    <>
                      Êtes-vous sûr de vouloir supprimer "{product.title}" ? 
                      <br /><br />
                      <strong>Cette action est irréversible.</strong>
                    </>
                  ) : (
                    <>
                      Ce produit a des commandes ou conversations associées et ne peut pas être supprimé.
                      <br /><br />
                      <strong>Utilisez l'archivage</strong> pour masquer ce produit de la boutique tout en conservant l'historique.
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                {canDelete ? (
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Supprimer
                  </AlertDialogAction>
                ) : (
                  <AlertDialogAction
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      handleArchive();
                    }}
                    className="bg-primary"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archiver à la place
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
