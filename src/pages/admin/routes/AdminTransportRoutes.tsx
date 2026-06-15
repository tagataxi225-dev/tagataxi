import { Suspense } from 'react';
import { FlexiblePermissionGuard } from '@/components/auth/FlexiblePermissionGuard';
import { AdminRentalManager } from '@/components/admin/AdminRentalManager';
import { VehicleTypeConfigManager } from '@/components/admin/VehicleTypeConfigManager';
import { ModernZoneManagementDashboard } from '@/components/admin/zones/ModernZoneManagementDashboard';
import { AdminVehicleModeration } from '@/components/admin/vehicles/AdminVehicleModeration';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

export const AdminTransportRoutes = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'dispatch':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['transport_admin']}>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Dispatch & Répartition</h2>
              <p className="text-muted-foreground">Module de dispatch en développement</p>
            </div>
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    case 'location':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['transport_admin']}>
            <AdminRentalManager />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    case 'vehicle-types':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['transport_admin']}>
            <VehicleTypeConfigManager />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    case 'zones':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['transport_admin']}>
            <ModernZoneManagementDashboard />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    case 'vehicle-moderation':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['transport_admin']}>
            <AdminVehicleModeration />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    default:
      return null;
  }
};
