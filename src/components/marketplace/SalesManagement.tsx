import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  Edit3,
  TrendingUp,
  DollarSign,
  Users,
  Eye,
  Search,
  Filter
} from 'lucide-react';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface Product {
  id: string;
  title: string;
  price: number;
  status: string;
  images?: any;
  created_at: string;
}

interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}

interface SalesManagementProps {
  onAddProduct?: () => void;
  onEditProduct?: (product: Product) => void;
  onViewProduct?: (product: Product) => void;
}

export const SalesManagement: React.FC<SalesManagementProps> = ({ 
  onAddProduct, 
  onEditProduct, 
  onViewProduct 
}) => {
  const { orders, loading: ordersLoading, confirmOrder, markAsDelivered } = useMarketplaceOrders();
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Filter orders where current user is the seller
  const salesOrders = orders.filter(order => order.seller_id === user?.id);

  // Calculate stats
  const stats: SalesStats = {
    totalSales: salesOrders.length,
    totalRevenue: salesOrders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + (order.total_amount || 0), 0),
    pendingOrders: salesOrders.filter(order => order.status === 'pending').length,
    completedOrders: salesOrders.filter(order => order.status === 'completed').length,
  };

  // Fetch user's products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('marketplace_products')
          .select('*')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger vos produits",
          variant: "destructive",
        });
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [user?.id, toast]);

  const handleConfirmOrder = async (orderId: string) => {
    try {
      await confirmOrder(orderId);
      toast({
        title: "Commande confirmée",
        description: "La commande a été confirmée avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de confirmer la commande",
        variant: "destructive",
      });
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      await markAsDelivered(orderId);
      toast({
        title: "Commande marquée comme livrée",
        description: "La commande a été marquée comme livrée",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer la commande comme livrée",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <Package className="w-4 h-4" />;
      case 'delivered': return <Truck className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ventes totales</p>
                <p className="text-2xl font-bold">{stats.totalSales}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenus</p>
                <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} FC</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{stats.pendingOrders}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Terminées</p>
                <p className="text-2xl font-bold">{stats.completedOrders}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes récentes</CardTitle>
          <CardDescription>Vos dernières commandes en attente d'action</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {salesOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-medium">{order.product?.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Par {order.buyer?.display_name} • {order.total_amount?.toLocaleString()} FC
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(order.status)}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1">{order.status}</span>
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher par produit ou acheteur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="confirmed">Confirmé</SelectItem>
            <SelectItem value="delivered">Livré</SelectItem>
            <SelectItem value="completed">Terminé</SelectItem>
            <SelectItem value="cancelled">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {salesOrders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                  <Package className="w-8 h-8" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{order.product?.title}</h3>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{order.status}</span>
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Acheteur: {order.buyer?.display_name}</p>
                    <p>Quantité: {order.quantity} • Total: {order.total_amount?.toLocaleString()} FC</p>
                    {order.delivery_address && <p>Livraison: {order.delivery_address}</p>}
                  </div>
                </div>
              </div>

              <Separator className="my-4" />
              
              <div className="flex flex-wrap gap-2">
                {order.status === 'pending' && (
                  <Button 
                    size="sm" 
                    onClick={() => handleConfirmOrder(order.id)}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirmer
                  </Button>
                )}
                
                {order.status === 'confirmed' && (
                  <Button 
                    size="sm" 
                    onClick={() => handleMarkDelivered(order.id)}
                    className="flex items-center gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    Marquer comme livré
                  </Button>
                )}
                
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Voir détails
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Mes produits</h3>
        <Button 
          className="flex items-center gap-2"
          onClick={onAddProduct}
        >
          <Package className="w-4 h-4" />
          Ajouter un produit
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                {Array.isArray(product.images) && product.images.length > 0 ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.title}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                ) : (
                  <Package className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              
              <h4 className="font-medium mb-2 line-clamp-2">{product.title}</h4>
              <p className="text-lg font-bold text-primary mb-2">{product.price.toLocaleString()} CDF</p>
              
              <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                {product.status === 'active' ? 'Actif' : 'Inactif'}
              </Badge>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => onEditProduct?.(product)}
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Modifier
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => onViewProduct?.(product)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Voir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  if (ordersLoading || productsLoading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          {renderDashboard()}
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          {renderOrders()}
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          {renderProducts()}
        </TabsContent>
      </Tabs>
    </div>
  );
};