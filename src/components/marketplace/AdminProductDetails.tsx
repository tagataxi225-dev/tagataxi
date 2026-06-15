import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  Eye, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Package,
  User,
  Calendar,
  MapPin,
  Tag,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EditProductForm } from './EditProductForm';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  status: string;
  moderation_status: string;
  seller_id: string;
  images: string[];
  created_at: string;
  updated_at: string;
  featured?: boolean;
  seller?: {
    display_name: string;
  };
}

interface AdminProductDetailsProps {
  product: Product;
  onBack: () => void;
  onUpdate: () => void;
}

const statuses = [
  { id: 'active', name: 'Actif', variant: 'default' as const },
  { id: 'inactive', name: 'Inactif', variant: 'secondary' as const },
  { id: 'sold', name: 'Vendu', variant: 'outline' as const }
];

const moderationStatuses = [
  { id: 'pending', name: 'En attente', variant: 'secondary' as const },
  { id: 'approved', name: 'Approuvé', variant: 'default' as const },
  { id: 'rejected', name: 'Rejeté', variant: 'destructive' as const }
];

export const AdminProductDetails: React.FC<AdminProductDetailsProps> = ({ product, onBack, onUpdate }) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [moderationNotes, setModerationNotes] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_products')
        .update({ status: newStatus })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: 'Statut mis à jour',
        description: 'Le statut du produit a été modifié avec succès'
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive'
      });
    }
  };

  const handleModerationChange = async (newStatus: string) => {
    try {
      const updates: any = { moderation_status: newStatus };
      
      // If approving, also activate the product
      if (newStatus === 'approved') {
        updates.status = 'active';
      }
      // If rejecting, deactivate the product
      else if (newStatus === 'rejected') {
        updates.status = 'inactive';
      }

      const { error } = await supabase
        .from('marketplace_products')
        .update(updates)
        .eq('id', product.id);

      if (error) throw error;

      // Log moderation action
      if (moderationNotes) {
        await supabase
          .from('activity_logs')
          .insert({
            user_id: product.seller_id,
            activity_type: 'product_moderation',
            description: `Produit ${newStatus === 'approved' ? 'approuvé' : 'rejeté'}: ${product.title}`,
            reference_type: 'marketplace_product',
            reference_id: product.id,
            metadata: { notes: moderationNotes, action: newStatus }
          });
      }

      toast({
        title: 'Modération mise à jour',
        description: `Le produit a été ${newStatus === 'approved' ? 'approuvé' : 'rejeté'} avec succès`
      });

      setModerationNotes('');
      onUpdate();
    } catch (error) {
      console.error('Error updating moderation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la modération',
        variant: 'destructive'
      });
    }
  };

  const handleFeaturedToggle = async () => {
    try {
      const { error } = await supabase
        .from('marketplace_products')
        .update({ featured: !product.featured })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: 'Mise en avant mise à jour',
        description: `Le produit ${!product.featured ? 'est maintenant' : 'n\'est plus'} mis en avant`
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating featured status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la mise en avant',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement ce produit ?')) return;

    try {
      const { error } = await supabase
        .from('marketplace_products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: 'Produit supprimé',
        description: 'Le produit a été supprimé définitivement'
      });

      onBack();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le produit',
        variant: 'destructive'
      });
    }
  };

  if (isEditing) {
    return (
      <EditProductForm
        product={product}
        onBack={() => setIsEditing(false)}
        onUpdate={() => {
          setIsEditing(false);
          onUpdate();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Détails du produit</h1>
              <p className="text-sm text-muted-foreground">Gestion administrative complète</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Modifier
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteProduct}
            >
              <X className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Product Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Images du produit ({product.images?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {product.images && product.images.length > 0 ? (
              <div className="space-y-4">
                {/* Main Image */}
                <div className="aspect-square max-w-md mx-auto bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={product.images[selectedImageIndex]} 
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Thumbnail Gallery */}
                {product.images.length > 1 && (
                  <div className="flex gap-2 justify-center flex-wrap">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                          selectedImageIndex === index ? 'border-primary' : 'border-muted'
                        }`}
                      >
                        <img 
                          src={image} 
                          alt={`${product.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-square max-w-md mx-auto bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Aucune image</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Informations du produit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Titre</Label>
              <h2 className="text-xl font-semibold">{product.title}</h2>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">Description</Label>
              <p className="text-foreground mt-1">{product.description}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Prix</Label>
                <p className="text-lg font-semibold text-primary">{product.price.toLocaleString()} CDF</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Catégorie</Label>
                <p className="font-medium">{product.category}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">État</Label>
                <p className="font-medium">{product.condition}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Mis en avant</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Switch 
                    checked={product.featured || false}
                    onCheckedChange={handleFeaturedToggle}
                  />
                  <span className="text-sm">{product.featured ? 'Oui' : 'Non'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Gestion des statuts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Statut de publication</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={statuses.find(s => s.id === product.status)?.variant || 'outline'}>
                    {statuses.find(s => s.id === product.status)?.name || product.status}
                  </Badge>
                  <Select value={product.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(status => (
                        <SelectItem key={status.id} value={status.id}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Statut de modération</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={moderationStatuses.find(s => s.id === product.moderation_status)?.variant || 'outline'}>
                    {moderationStatuses.find(s => s.id === product.moderation_status)?.name || product.moderation_status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Moderation Actions */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <Label className="text-sm font-medium">Actions de modération</Label>
              <Textarea
                placeholder="Notes de modération (optionnel)..."
                value={moderationNotes}
                onChange={(e) => setModerationNotes(e.target.value)}
                rows={2}
              />
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => handleModerationChange('approved')}
                  disabled={product.moderation_status === 'approved'}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approuver
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleModerationChange('rejected')}
                  disabled={product.moderation_status === 'rejected'}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Rejeter
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleModerationChange('pending')}
                  disabled={product.moderation_status === 'pending'}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  En attente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seller Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Informations du vendeur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Vendeur:</span>
              <span className="font-medium">{product.seller?.display_name || 'Utilisateur inconnu'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">ID:</span>
              <span className="font-mono text-sm">{product.seller_id}</span>
            </div>
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Historique
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Créé le:</span>
              <span>{new Date(product.created_at).toLocaleString('fr-FR')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Modifié le:</span>
              <span>{new Date(product.updated_at).toLocaleString('fr-FR')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};