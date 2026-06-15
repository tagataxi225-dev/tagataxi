import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { PurchaseManagement } from './PurchaseManagement';
import { SalesManagement } from './SalesManagement';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShoppingBag, Store, MessageSquare, TrendingUp } from 'lucide-react';

interface ActivityTabProps {
  onAddProduct?: () => void;
  onEditProduct?: (product: any) => void;
  onViewProduct?: (product: any) => void;
}

export const ActivityTab: React.FC<ActivityTabProps> = ({ 
  onAddProduct, 
  onEditProduct, 
  onViewProduct 
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('purchases');

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Connectez-vous pour voir vos activités</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Mes Activités</h1>
        <p className="text-muted-foreground">Gérez vos achats, ventes et transactions</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="purchases" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Mes Achats
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            Mes Ventes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="mt-6">
          <PurchaseManagement />
        </TabsContent>

        <TabsContent value="sales" className="mt-6">
          <SalesManagement 
            onAddProduct={onAddProduct}
            onEditProduct={onEditProduct}
            onViewProduct={onViewProduct}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};