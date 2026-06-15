import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingDataTable } from './BookingDataTable';
import { BookingFilters } from './BookingFilters';
import { BookingStatsCards } from './BookingStatsCards';
import { useBookingManagement } from '@/hooks/useBookingManagement';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Car } from 'lucide-react';

export const BookingManagement: React.FC = () => {
  const {
    bookings,
    stats,
    loading,
    error,
    totalPages,
    currentPage,
    filters,
    setFilters,
    setCurrentPage,
    refreshData,
    exportBookings,
    cancelBooking,
    assignDriver,
  } = useBookingManagement();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Car className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-heading-lg font-bold text-foreground">
              Gestion des Courses
            </h1>
            <p className="text-body-sm text-muted-foreground">
              Gérez toutes les courses transport de la plateforme
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
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportBookings}
          >
            <Download className="h-4 w-4 mr-1" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <BookingStatsCards stats={stats} />

      {/* Filters */}
      <BookingFilters
        filters={filters}
        onFiltersChange={setFilters}
        loading={loading}
      />

      {/* Main Data Table */}
      <Card className="card-floating border-0">
        <CardHeader>
          <CardTitle className="text-heading-md">
            Liste des Courses
            {bookings.length > 0 && (
              <span className="text-muted-foreground text-body-sm font-normal ml-2">
                ({bookings.length} courses affichées)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BookingDataTable
            bookings={bookings}
            loading={loading}
            error={error}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            filters={filters}
            onSortChange={(sortBy, sortOrder) => 
              setFilters({ sortBy, sortOrder })
            }
            onCancelBooking={cancelBooking}
            onAssignDriver={assignDriver}
          />
        </CardContent>
      </Card>
    </div>
  );
};
