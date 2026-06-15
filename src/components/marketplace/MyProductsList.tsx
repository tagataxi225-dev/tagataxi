import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, CheckCircle, XCircle, Clock, Edit } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  images?: string[];
}

interface MyProductsListProps {
  loadMyProducts: () => Promise<Product[]>;
  onEditProduct?: (product: Product) => void;
}

export const MyProductsList = ({ loadMyProducts, onEditProduct }: MyProductsListProps) => {
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const products = await loadMyProducts();
      setMyProducts(products);
      setLoading(false);
    };
    fetchProducts();
  }, [loadMyProducts]);

  if (loading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Mes Produits</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (myProducts.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Mes Produits</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Vous n'avez pas encore de produits.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Mes Produits ({myProducts.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {myProducts.some(p => p.moderation_status === 'pending') && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 flex items-start space-x-3 shadow-sm">
            <div className="bg-yellow-200 rounded-full p-2">
              <Clock className="h-5 w-5 text-yellow-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 text-base">
                {myProducts.filter(p => p.moderation_status === 'pending').length} produit(s) en attente de modération
              </h3>
              <p className="text-sm text-yellow-800 mt-2 leading-relaxed">
                Vos produits sont en cours de vérification par notre équipe. Ils seront visibles sur la marketplace après validation (généralement sous 24 heures).
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                📢 Vous recevrez une notification dès que vos produits seront modérés.
              </p>
            </div>
          </div>
        )}

        {myProducts.some(p => p.moderation_status === 'rejected') && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 flex items-start space-x-3 shadow-sm">
            <div className="bg-red-200 rounded-full p-2">
              <XCircle className="h-5 w-5 text-red-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 text-base">
                {myProducts.filter(p => p.moderation_status === 'rejected').length} produit(s) rejeté(s)
              </h3>
              <p className="text-sm text-red-800 mt-2 leading-relaxed">
                Certains de vos produits ont été rejetés. Vérifiez les raisons ci-dessous, corrigez les problèmes et soumettez à nouveau.
              </p>
            </div>
          </div>
        )}

        {myProducts.some(p => p.moderation_status === 'approved') && (
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 flex items-start space-x-3 shadow-sm">
            <div className="bg-green-200 rounded-full p-2">
              <CheckCircle className="h-5 w-5 text-green-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 text-base">
                {myProducts.filter(p => p.moderation_status === 'approved').length} produit(s) approuvé(s) et visible(s)
              </h3>
              <p className="text-sm text-green-800 mt-2 leading-relaxed">
                🎉 Vos produits sont visibles sur la marketplace et disponibles à l'achat !
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                {product.images && product.images.length > 0 && (
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-32 object-cover rounded-md mb-3"
                  />
                )}
                <h3 className="font-semibold mb-2 line-clamp-2">{product.title}</h3>
                <p className="text-lg font-bold text-primary mb-2">
                  {product.price} {product.currency}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    {product.moderation_status === 'approved' && (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approuvé
                      </Badge>
                    )}
                    {product.moderation_status === 'pending' && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        <Clock className="h-3 w-3 mr-1" />
                        En attente
                      </Badge>
                    )}
                    {product.moderation_status === 'rejected' && (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejeté
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(product.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {product.moderation_status === 'rejected' && product.rejection_reason && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                      <strong className="block mb-1">Raison du rejet:</strong>
                      {product.rejection_reason}
                    </div>
                  )}
                  
                  {/* Bouton Modifier pour produits approuvés ou rejetés */}
                  {(product.moderation_status === 'approved' || product.moderation_status === 'rejected') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onEditProduct?.(product)}
                      className="w-full mt-3"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier le produit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
