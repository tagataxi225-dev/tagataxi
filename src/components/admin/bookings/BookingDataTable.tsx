import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { BookingProfile, BookingFilters } from '@/hooks/useBookingManagement';
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, XCircle, UserPlus, MoreHorizontal, MapPin, Car, Phone } from 'lucide-react';

interface BookingDataTableProps {
  bookings: BookingProfile[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  filters: BookingFilters;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onCancelBooking: (bookingId: string, reason: string) => Promise<void>;
  onAssignDriver: (bookingId: string, driverId: string) => Promise<void>;
}

const statusColors: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  pending: { variant: 'secondary', label: 'En attente' },
  confirmed: { variant: 'default', label: 'Confirmé' },
  driver_assigned: { variant: 'default', label: 'Chauffeur assigné' },
  in_progress: { variant: 'default', label: 'En cours' },
  completed: { variant: 'outline', label: 'Complété' },
  cancelled: { variant: 'destructive', label: 'Annulé' },
};

export const BookingDataTable: React.FC<BookingDataTableProps> = ({
  bookings,
  loading,
  error,
  currentPage,
  totalPages,
  onPageChange,
  filters,
  onSortChange,
  onCancelBooking,
  onAssignDriver,
}) => {
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; bookingId: string | null }>({
    open: false,
    bookingId: null,
  });
  const [cancelReason, setCancelReason] = useState('');
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; booking: BookingProfile | null }>({
    open: false,
    booking: null,
  });

  const handleSort = (column: string) => {
    const newOrder = filters.sortBy === column && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(column, newOrder);
  };

  const getSortIcon = (column: string) => {
    if (filters.sortBy !== column) return <ArrowUpDown className="h-4 w-4" />;
    return filters.sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const handleCancelConfirm = async () => {
    if (cancelDialog.bookingId && cancelReason) {
      await onCancelBooking(cancelDialog.bookingId, cancelReason);
      setCancelDialog({ open: false, bookingId: null });
      setCancelReason('');
    }
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Aucune course trouvée</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Trajet</TableHead>
              <TableHead>Véhicule</TableHead>
              <TableHead>Chauffeur</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort('estimated_price')}
              >
                <div className="flex items-center gap-1">
                  Prix
                  {getSortIcon('estimated_price')}
                </div>
              </TableHead>
              <TableHead>Statut</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-1">
                  Date
                  {getSortIcon('created_at')}
                </div>
              </TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => {
              const statusInfo = statusColors[booking.status] || { variant: 'secondary', label: booking.status };
              
              return (
                <TableRow key={booking.id}>
                  <TableCell className="font-mono text-xs">
                    {booking.id.substring(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{booking.customer_name}</p>
                      {booking.customer_phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {booking.customer_phone}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[250px]">
                      <p className="text-xs flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 text-green-500 shrink-0" />
                        {booking.pickup_location}
                      </p>
                      <p className="text-xs flex items-center gap-1 truncate text-muted-foreground">
                        <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                        {booking.destination}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{booking.vehicle_type}</Badge>
                  </TableCell>
                  <TableCell>
                    {booking.driver_name ? (
                      <div>
                        <p className="font-medium text-sm">{booking.driver_name}</p>
                        {booking.driver_phone && (
                          <p className="text-xs text-muted-foreground">{booking.driver_phone}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Non assigné</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {(booking.actual_price || booking.estimated_price || 0).toLocaleString()} CDF
                      </p>
                      {booking.actual_price && booking.estimated_price && booking.actual_price !== booking.estimated_price && (
                        <p className="text-xs text-muted-foreground line-through">
                          {booking.estimated_price.toLocaleString()} CDF
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{new Date(booking.created_at).toLocaleDateString('fr-FR')}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(booking.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDetailDialog({ open: true, booking })}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        {!booking.driver_id && booking.status !== 'cancelled' && booking.status !== 'completed' && (
                          <DropdownMenuItem>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assigner chauffeur
                          </DropdownMenuItem>
                        )}
                        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                          <DropdownMenuItem
                            onClick={() => setCancelDialog({ open: true, bookingId: booking.id })}
                            className="text-destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Annuler course
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = i + 1;
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => onPageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ open, bookingId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la course</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison de l'annulation.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Raison de l'annulation..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog({ open: false, bookingId: null })}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleCancelConfirm} disabled={!cancelReason}>
              Confirmer l'annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog({ open, booking: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la course</DialogTitle>
          </DialogHeader>
          {detailDialog.booking && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ID</p>
                <p className="font-mono">{detailDialog.booking.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <Badge variant={statusColors[detailDialog.booking.status]?.variant || 'secondary'}>
                  {statusColors[detailDialog.booking.status]?.label || detailDialog.booking.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p>{detailDialog.booking.customer_name}</p>
                {detailDialog.booking.customer_phone && (
                  <p className="text-sm text-muted-foreground">{detailDialog.booking.customer_phone}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chauffeur</p>
                <p>{detailDialog.booking.driver_name || 'Non assigné'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Départ</p>
                <p>{detailDialog.booking.pickup_location}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Destination</p>
                <p>{detailDialog.booking.destination}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type de véhicule</p>
                <p>{detailDialog.booking.vehicle_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prix</p>
                <p className="font-bold">
                  {(detailDialog.booking.actual_price || detailDialog.booking.estimated_price || 0).toLocaleString()} CDF
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date de création</p>
                <p>{new Date(detailDialog.booking.created_at).toLocaleString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Distance</p>
                <p>{detailDialog.booking.total_distance ? `${detailDialog.booking.total_distance} km` : 'N/A'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
