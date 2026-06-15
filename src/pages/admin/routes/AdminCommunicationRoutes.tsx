import { Suspense, lazy } from 'react';
const AdminRatingsManager = lazy(() => import('@/components/admin/AdminRatingsManager'));
import { FlexiblePermissionGuard } from '@/components/auth/FlexiblePermissionGuard';
import { AdminNotificationCenter } from '@/components/admin/AdminNotificationCenter';
import { AdminPushNotificationManager } from '@/components/admin/push/AdminPushNotificationManager';
import { EnhancedSupportCenter } from '@/components/admin/support/EnhancedSupportCenter';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

export const AdminCommunicationRoutes = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'notifications':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['notifications_write']}>
            <AdminNotificationCenter />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    case 'push-notifications':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['notifications_write']}>
            <AdminPushNotificationManager />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    case 'support':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['support_admin']}>
            <EnhancedSupportCenter />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    case 'ratings':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <AdminRatingsManager />
        </Suspense>
      );
    default:
      return null;
  }
};
