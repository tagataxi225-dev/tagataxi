import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Package } from 'lucide-react';
import { useDeliveryManagement } from '@/hooks/useDeliveryManagement';
import { DeliveryStatsCards } from './DeliveryStatsCards';
import { DeliveryFilters } from './DeliveryFilters';
import { DeliveryDataTable } from './DeliveryDataTable';

export const DeliveryManagement: React.FC = () => {
  const {
    deliveries,
    stats,
    loading,
    totalPages,
    currentPage,
    filters,
    setFilters,
    setCurrentPage,
    refreshData,
    exportDeliveries,
    cancelDelivery,
    assignDriver,
    markDelivered,
  } = useDeliveryManagement();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Gestion des Livraisons
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.totalDeliveries} livraisons au total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Rafraîchir
          </Button>
          <Button variant="outline" size="sm" onClick={exportDeliveries}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <DeliveryStatsCards stats={stats} loading={loading} />

      {/* Filters */}
      <DeliveryFilters filters={filters} onFiltersChange={setFilters} />

      {/* Data Table */}
      <DeliveryDataTable
        deliveries={deliveries}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onCancel={cancelDelivery}
        onAssignDriver={assignDriver}
        onMarkDelivered={markDelivered}
      />
    </div>
  );
};
