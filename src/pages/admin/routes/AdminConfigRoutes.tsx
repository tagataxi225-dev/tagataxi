import { Suspense, lazy } from 'react';
import { FlexiblePermissionGuard } from '@/components/auth/FlexiblePermissionGuard';
import { ServiceManagementPanel } from '@/components/admin/services/ServiceManagementPanel';
import { PricingManagementPanel } from '@/components/admin/PricingManagementPanel';
import { UnifiedSubscriptionManager } from '@/components/admin/subscriptions/UnifiedSubscriptionManager';
import { SubscriptionPlansConfig } from '@/components/admin/subscriptions/SubscriptionPlansConfig';
import { AdminPromoCodeManager } from '@/components/admin/AdminPromoCodeManager';
import { Loader2 } from 'lucide-react';

const WithdrawalManagement = lazy(() => import('@/pages/admin/WithdrawalManagement'));
const AdminBannerManager = lazy(() => import('@/components/admin/banners/AdminBannerManager'));
const AdminAmbassadorManager = lazy(() => import('@/components/admin/ambassadors/AdminAmbassadorManager'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

export const AdminConfigRoutes = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'services':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
            <ServiceManagementPanel />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    case 'tarifs':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['finance_admin']}>
            <PricingManagementPanel />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    case 'subscriptions':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
            <UnifiedSubscriptionManager />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    case 'subscription-config':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['finance_admin']}>
            <SubscriptionPlansConfig />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    case 'promocodes':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['marketplace_write']}>
            <AdminPromoCodeManager />
          </FlexiblePermissionGuard>
        </Suspense>
      );

    case 'withdrawals':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['finance_admin']}>
            <WithdrawalManagement />
          </FlexiblePermissionGuard>
        </Suspense>
      );

    case 'banners':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['notifications_write']}>
            <AdminBannerManager />
          </FlexiblePermissionGuard>
        </Suspense>
      );

    case 'ambassadors':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
            <AdminAmbassadorManager />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    default:
      return null;
  }
};
