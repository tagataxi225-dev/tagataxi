import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAdminMarketplaceProducts } from '@/hooks/admin/useAdminMarketplaceProducts';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export const AdminMarketplaceModeration = () => {
  const { pendingProducts, approveProduct, rejectProduct, loading } = useAdminMarketplaceProducts();
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Modération produits marketplace</h2>

      {pendingProducts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucun produit en attente de modération
          </CardContent>
        </Card>
      ) : (
        pendingProducts.map((product: any) => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{product.title}</CardTitle>
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  En attente
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {product.video_url && (
                    <div className="relative rounded-lg overflow-hidden border bg-black">
                      <Badge variant="secondary" className="absolute top-2 left-2 z-10 bg-black/70 text-white text-[10px]">🎬 Vidéo</Badge>
                      <video
                        src={product.video_url}
                        controls
                        className="w-full h-48 object-contain"
                        preload="metadata"
                      />
                    </div>
                  )}
                  {product.images?.[0] && (
                    <img src={product.images[0]} alt={product.title} className="w-full h-48 object-cover rounded" />
                  )}
                </div>
                <div>
                  <p><strong>Prix:</strong> {product.price} FC</p>
                  <p><strong>Catégorie:</strong> {product.category}</p>
                  <p><strong>Vendeur:</strong> {product.seller_name || 'Inconnu'}</p>
                  <p className="mt-2"><strong>Description:</strong></p>
                  <p className="text-sm">{product.description}</p>
                </div>
              </div>

              <Textarea
                placeholder="Raison du rejet (si rejeté)..."
                value={rejectionReasons[product.id] || ''}
                onChange={(e) => setRejectionReasons(prev => ({ ...prev, [product.id]: e.target.value }))}
              />

              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  onClick={() => approveProduct(product.id)}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approuver
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => rejectProduct(product.id, rejectionReasons[product.id] || 'Non conforme')}
                  disabled={!rejectionReasons[product.id]}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
