import { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { FlexiblePermissionGuard } from '@/components/auth/FlexiblePermissionGuard';
import { OverviewDashboard } from '@/components/admin/OverviewDashboard';
import { FinancialSubscriptionDashboard } from '@/components/admin/subscriptions/FinancialSubscriptionDashboard';
import { CancellationManagement } from '@/components/admin/CancellationManagement';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

export const AdminAnalyticsRoutes = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'overview':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['analytics_read']}>
            <OverviewDashboard />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    case 'financial-stats':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['finance_read']}>
            <FinancialSubscriptionDashboard />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    case 'cancellations':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['analytics_read']}>
            <CancellationManagement />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    default:
      return null;
  }
};
