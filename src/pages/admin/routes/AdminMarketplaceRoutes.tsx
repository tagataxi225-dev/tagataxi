import { Suspense } from 'react';
import { FlexiblePermissionGuard } from '@/components/auth/FlexiblePermissionGuard';
import { AdminMarketplaceManager } from '@/components/admin/AdminMarketplaceManager';
import { ProductModeration } from '@/pages/admin/marketplace/ProductModeration';
import { AdminFoodDashboard } from '@/components/admin/food/AdminFoodDashboard';
import AdminFoodManagement from '@/pages/admin/AdminFoodManagement';
import AdminMarketplaceManagement from '@/pages/admin/AdminMarketplaceManagement';
import { AdminEscrowManager } from '@/components/admin/escrow/AdminEscrowManager';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

export const AdminMarketplaceRoutes = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'marketplace':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['marketplace_moderate']}>
            <AdminMarketplaceManager />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    case 'marketplace-products':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['marketplace_moderate']}>
            <ProductModeration />
          </FlexiblePermissionGuard>
        </Suspense>
      );

    case 'escrow':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
            <AdminEscrowManager />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    case 'food':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['food_admin']}>
            <AdminFoodDashboard />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    case 'food-management':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['food_admin']}>
            <AdminFoodManagement />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    case 'marketplace-management':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['marketplace_moderate']}>
            <AdminMarketplaceManagement />
          </FlexiblePermissionGuard>
        </Suspense>
      );

    case 'restaurants':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <AdminFoodManagement />
        </Suspense>
      );

    default:
      return null;
  }
};
