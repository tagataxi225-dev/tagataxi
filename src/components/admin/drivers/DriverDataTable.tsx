import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { DriverProfile, DriverFilters } from '@/hooks/useDriverManagement';
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit, MoreHorizontal, Phone, Car } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DriverDataTableProps {
  drivers: DriverProfile[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedDrivers: string[];
  onSelectDriver: (driverId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  filters: DriverFilters;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onUpdateStatus: (driverId: string, status: string) => Promise<void>;
}

export const DriverDataTable: React.FC<DriverDataTableProps> = ({
  drivers,
  loading,
  error,
  currentPage,
  totalPages,
  onPageChange,
  selectedDrivers,
  onSelectDriver,
  onSelectAll,
  filters,
  onSortChange,
  onUpdateStatus,
}) => {
  const handleSort = (column: string) => {
    if (filters.sortBy === column) {
      onSortChange(column, filters.sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(column, 'asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (filters.sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return filters.sortOrder === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const getOnlineStatusColor = (isOnline?: boolean) => {
    return isOnline ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground';
  };

  const getOnlineStatusText = (driver: DriverProfile) => {
    if (driver.is_online) {
      return driver.is_available ? 'Disponible' : 'Occupé';
    }
    return 'Hors ligne';
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'rejected':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getServiceTypeColor = (serviceType: string) => {
    switch (serviceType) {
      case 'taxi':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'delivery':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'moto':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'bus':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive text-body-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 sticky left-0 bg-background z-10">
                <Checkbox
                  checked={drivers.length > 0 && selectedDrivers.length === drivers.length}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
              <TableHead className="sticky left-12 bg-background z-10">Chauffeur</TableHead>
              <TableHead>Véhicule</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('service_type')}
                  className="h-auto p-0 font-medium"
                >
                  Service {getSortIcon('service_type')}
                </Button>
              </TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('verification_status')}
                  className="h-auto p-0 font-medium"
                >
                  Vérification {getSortIcon('verification_status')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('created_at')}
                  className="h-auto p-0 font-medium"
                >
                  Inscription {getSortIcon('created_at')}
                </Button>
              </TableHead>
              <TableHead>Performance</TableHead>
              <TableHead className="w-12 sticky right-0 bg-background z-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 10 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="sticky left-0 bg-background"><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell className="sticky left-12 bg-background">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="sticky right-0 bg-background"><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : drivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <p className="text-muted-foreground">Aucun chauffeur trouvé</p>
                </TableCell>
              </TableRow>
            ) : (
              drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="sticky left-0 bg-background">
                    <Checkbox
                      checked={selectedDrivers.includes(driver.id)}
                      onCheckedChange={(checked) => onSelectDriver(driver.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="sticky left-12 bg-background">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={driver.avatar_url} />
                          <AvatarFallback>
                            {driver.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {driver.is_online && (
                          <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {driver.display_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{driver.email}</span>
                          {driver.phone_number && (
                            <>
                              <span>•</span>
                              <Phone className="h-3 w-3" />
                              <span>{driver.phone_number}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">
                          {driver.vehicle_make} {driver.vehicle_model}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {driver.vehicle_plate}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getServiceTypeColor(driver.service_type)}>
                      {driver.service_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getOnlineStatusColor(driver.is_online)}>
                      {getOnlineStatusText(driver)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getVerificationColor(driver.verification_status)}>
                      {driver.verification_status === 'verified' ? 'Vérifié' :
                       driver.verification_status === 'pending' ? 'En attente' : 'Rejeté'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <time className="text-sm text-muted-foreground">
                      {format(new Date(driver.created_at), 'dd MMM yyyy', { locale: fr })}
                    </time>
                    {driver.last_activity && (
                      <p className="text-xs text-muted-foreground">
                        Dernière activité: {format(new Date(driver.last_activity), 'dd/MM HH:mm', { locale: fr })}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="text-foreground">{driver.total_rides} courses</p>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">⭐</span>
                        <span className="text-muted-foreground">{driver.rating_average.toFixed(1)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="sticky right-0 bg-background">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="end" 
                        side="bottom"
                        sideOffset={8}
                        collisionPadding={10}
                        className="w-56"
                      >
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir le profil
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onUpdateStatus(driver.id, driver.is_active ? 'inactive' : 'active')}
                        >
                          {driver.is_active ? 'Désactiver' : 'Activer'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages}
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) onPageChange(currentPage - 1);
                  }}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === page}
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(page);
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) onPageChange(currentPage + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};