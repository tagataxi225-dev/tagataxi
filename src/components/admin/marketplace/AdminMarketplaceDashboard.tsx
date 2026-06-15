import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminMarketplaceProducts } from '@/hooks/admin/useAdminMarketplaceProducts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  BarChart
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export const AdminMarketplaceDashboard: React.FC = () => {
  const { toast } = useToast();
  const { pendingProducts, loading, approveProduct, rejectProduct } = useAdminMarketplaceProducts();
  const [activeTab, setActiveTab] = useState('moderation');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  const handleApprove = async (productId: string) => {
    approveProduct(productId);
  };

  const handleReject = async (productId: string) => {
    const reason = rejectionReasons[productId];
    if (!reason || reason.trim() === '') {
      toast({
        title: 'Erreur',
        description: 'Veuillez fournir une raison de rejet',
        variant: 'destructive'
      });
      return;
    }
    rejectProduct(productId, reason);
    setRejectionReasons(prev => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });
  };

  const filteredProducts = pendingProducts.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.seller_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Marketplace Admin</h2>
        <p className="text-muted-foreground">
          Gérez les produits, commandes et vendeurs de la marketplace
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="moderation">
            <Clock className="h-4 w-4 mr-2" />
            Modération ({pendingProducts.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="overview">
            <Package className="h-4 w-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
        </TabsList>

        <TabsContent value="moderation" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Produits en attente de modération</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Aucun produit trouvé' : 'Aucun produit en attente'}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex gap-4">
                          {product.images && product.images.length > 0 && (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                          )}
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-lg">{product.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Par {product.seller_name || 'Vendeur inconnu'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-red-600">
                                  {product.price.toLocaleString()} CDF
                                </p>
                                <Badge variant="secondary">{product.category}</Badge>
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {product.description}
                            </p>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline">
                                Stock: {product.stock_quantity}
                              </Badge>
                              {product.shipping_available && (
                                <Badge variant="outline">Livraison disponible</Badge>
                              )}
                            </div>

                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(product.id)}
                                className="flex-1"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approuver
                              </Button>
                              <div className="flex-1 space-y-2">
                                <Textarea
                                  placeholder="Raison du rejet..."
                                  value={rejectionReasons[product.id] || ''}
                                  onChange={(e) =>
                                    setRejectionReasons(prev => ({
                                      ...prev,
                                      [product.id]: e.target.value
                                    }))
                                  }
                                  className="min-h-[60px]"
                                />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(product.id)}
                                  className="w-full"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Rejeter
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Produits Totaux
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  Tous statuts confondus
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Commandes du mois
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  +0% par rapport au mois dernier
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Revenus du mois
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">- CDF</div>
                <p className="text-xs text-muted-foreground">
                  Commissions incluses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Taux de conversion
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-%</div>
                <p className="text-xs text-muted-foreground">
                  Vues → Achats
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Analytics détaillées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Analytics marketplace en développement</p>
                <p className="text-sm">Graphiques et statistiques avancées bientôt disponibles</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">En modération</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pendingProducts.length}</div>
                <Badge variant="secondary" className="mt-2">
                  <Clock className="h-3 w-3 mr-1" />
                  En attente
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Produits actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">-</div>
                <Badge className="mt-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approuvés
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Produits rejetés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">-</div>
                <Badge variant="destructive" className="mt-2">
                  <XCircle className="h-3 w-3 mr-1" />
                  Rejetés
                </Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMarketplaceDashboard;
