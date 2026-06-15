import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DriverDataTable } from './DriverDataTable';
import { DriverFilters } from './DriverFilters';
import { DriverStatsCards } from './DriverStatsCards';
import { useDriverManagement } from '@/hooks/useDriverManagement';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Car } from 'lucide-react';

export const DriverManagement: React.FC = () => {
  const {
    drivers,
    stats,
    loading,
    error,
    totalPages,
    currentPage,
    filters,
    setFilters,
    setCurrentPage,
    refreshData,
    exportDrivers,
    updateDriverStatus,
  } = useDriverManagement();

  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);

  const handleSelectDriver = (driverId: string, selected: boolean) => {
    if (selected) {
      setSelectedDrivers(prev => [...prev, driverId]);
    } else {
      setSelectedDrivers(prev => prev.filter(id => id !== driverId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedDrivers(drivers.map(driver => driver.id));
    } else {
      setSelectedDrivers([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
            <Car className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-heading-lg font-bold text-foreground">
              Gestion des Chauffeurs
            </h1>
            <p className="text-body-sm text-muted-foreground">
              Gérez tous les chauffeurs et livreurs de la plateforme
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportDrivers}
          >
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <DriverStatsCards stats={stats} />

      {/* Filters */}
      <DriverFilters
        filters={filters}
        onFiltersChange={setFilters}
        loading={loading}
      />

      {/* Main Data Table */}
      <Card className="card-floating border-0">
        <CardHeader>
          <CardTitle className="text-heading-md">
            Liste des Chauffeurs
            {drivers.length > 0 && (
              <span className="text-muted-foreground text-body-sm font-normal ml-2">
                ({drivers.length} chauffeurs affichés)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DriverDataTable
            drivers={drivers}
            loading={loading}
            error={error}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            selectedDrivers={selectedDrivers}
            onSelectDriver={handleSelectDriver}
            onSelectAll={handleSelectAll}
            filters={filters}
            onSortChange={(sortBy, sortOrder) => 
              setFilters({ sortBy, sortOrder })
            }
            onUpdateStatus={updateDriverStatus}
          />
        </CardContent>
      </Card>
    </div>
  );
};