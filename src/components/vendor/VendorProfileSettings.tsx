import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VendorProfileSetup } from './VendorProfileSetup';
import { VendorShopSettings } from '@/components/marketplace/VendorShopSettings';
import { VendorVerificationDashboard } from './modern/VendorVerificationDashboard';
import { User, Store, Shield } from 'lucide-react';

export const VendorProfileSettings = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Mon profil</span>
          </TabsTrigger>
          <TabsTrigger value="shop" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Ma boutique</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Vérification</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <VendorProfileSetup />
        </TabsContent>

        <TabsContent value="shop" className="mt-6">
          <VendorShopSettings />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <VendorVerificationDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};
