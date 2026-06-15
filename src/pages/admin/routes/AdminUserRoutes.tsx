import { Suspense } from 'react';
import { FlexiblePermissionGuard } from '@/components/auth/FlexiblePermissionGuard';
import { AdvancedUserManagement } from '@/components/admin/users/AdvancedUserManagement';
import { EnhancedRoleManagement } from '@/components/admin/roles/EnhancedRoleManagement';
import { DriverManagement } from '@/components/admin/drivers/DriverManagement';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

export const AdminUserRoutes = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'users':
      return (
        <FlexiblePermissionGuard requiredPermissions={['users_read']}>
          <AdvancedUserManagement />
        </FlexiblePermissionGuard>
      );
      
    case 'roles':
      return (
        <FlexiblePermissionGuard requiredPermissions={['users_write']}>
          <EnhancedRoleManagement />
        </FlexiblePermissionGuard>
      );
      
    case 'drivers':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['drivers_read']}>
            <DriverManagement />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    default:
      return null;
  }
};
