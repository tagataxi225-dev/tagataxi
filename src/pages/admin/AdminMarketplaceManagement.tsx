import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminMarketplaceModeration } from '@/components/admin/marketplace/AdminMarketplaceModeration';
import { AdminVendorSubscriptions } from '@/components/admin/marketplace/AdminVendorSubscriptions';
import { AdminCommissionConfig } from '@/components/admin/marketplace/AdminCommissionConfig';
import { AdminMarketplaceStats } from '@/components/admin/marketplace/AdminMarketplaceStats';
import { useAdminMarketplaceProducts } from '@/hooks/admin/useAdminMarketplaceProducts';
import { LayoutDashboard, Package, Shield, Users, DollarSign } from 'lucide-react';

export const AdminMarketplaceManagement = () => {
  const { pendingProducts } = useAdminMarketplaceProducts();
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion Marketplace</h1>
          <p className="text-muted-foreground">
            Administration complète : vendeurs, produits, abonnements et commissions
          </p>
        </div>
        {pendingProducts.length > 0 && (
          <Badge variant="destructive" className="animate-pulse h-7 px-4 text-sm">
            {pendingProducts.length} produit{pendingProducts.length > 1 ? 's' : ''} en attente
          </Badge>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Modération
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            <Users className="h-4 w-4 mr-2" />
            Abonnements
          </TabsTrigger>
          <TabsTrigger value="commissions">
            <DollarSign className="h-4 w-4 mr-2" />
            Commissions
          </TabsTrigger>
          <TabsTrigger value="escrow">
            <Shield className="h-4 w-4 mr-2" />
            Escrow
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <AdminMarketplaceStats />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <AdminMarketplaceModeration />
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-6">
          <AdminVendorSubscriptions />
        </TabsContent>

        <TabsContent value="commissions" className="mt-6">
          <AdminCommissionConfig />
        </TabsContent>

        <TabsContent value="escrow" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Suivi des fonds escrow</h2>
            <p className="text-muted-foreground">
              Le tableau de bord escrow sera ajouté prochainement.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMarketplaceManagement;
