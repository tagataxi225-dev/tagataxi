import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRentalAnalytics, RentalBookingFilters } from '@/hooks/useRentalAnalytics';
import { 
  Calendar,
  DollarSign,
  CheckCircle, 
  Clock, 
  XCircle, 
  Search,
  Eye,
  Download,
  RefreshCw,
  Filter,
  CreditCard,
  User
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const RentalBookingList = () => {
  const { useBookings, useBookingStats, updateBookingStatus } = useRentalAnalytics();

  const [filters, setFilters] = useState<RentalBookingFilters>({
    status: 'all',
    paymentStatus: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const { data: bookings, isLoading: bookingsLoading, refetch } = useBookings({
    ...filters,
    search: searchTerm
  });
  const { data: stats, isLoading: statsLoading } = useBookingStats();

  const handleViewDetails = (booking: any) => {
    setSelectedBooking(booking);
    setDetailsDialogOpen(true);
  };

  const handleUpdateStatus = (bookingId: string, status: string) => {
    updateBookingStatus.mutate({ bookingId, status });
  };

  const handleExport = () => {
    if (!bookings) return;
    
    const csvContent = [
      ['ID', 'Client', 'Véhicule', 'Début', 'Fin', 'Montant', 'Statut', 'Paiement'].join(','),
      ...bookings.map(b => [
        b.id.slice(0, 8),
        b.client_name,
        b.vehicle_name,
        format(new Date(b.start_date), 'dd/MM/yyyy'),
        format(new Date(b.end_date), 'dd/MM/yyyy'),
        b.total_amount,
        b.status,
        b.payment_status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservations-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">En attente</Badge>;
      case 'approved_by_partner':
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Approuvée</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Terminée</Badge>;
      case 'cancelled':
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Annulée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30"><CreditCard className="h-3 w-3 mr-1" />Payé</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'refunded':
        return <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30">Remboursé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsLoading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Calendar className="h-4 w-4" />
                  Total
                </div>
                <div className="text-2xl font-bold mt-1">{stats?.total || 0}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock className="h-4 w-4 text-orange-500" />
                  En attente
                </div>
                <div className="text-2xl font-bold mt-1 text-orange-600">{stats?.pending || 0}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  Approuvées
                </div>
                <div className="text-2xl font-bold mt-1 text-blue-600">{stats?.approved || 0}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Terminées
                </div>
                <div className="text-2xl font-bold mt-1 text-green-600">{stats?.completed || 0}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  Revenu total
                </div>
                <div className="text-xl font-bold mt-1 text-emerald-600">
                  {(stats?.totalRevenue || 0).toLocaleString()} <span className="text-sm">CDF</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!bookings?.length}>
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved_by_partner">Approuvées</SelectItem>
                <SelectItem value="completed">Terminées</SelectItem>
                <SelectItem value="cancelled">Annulées</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.paymentStatus} onValueChange={(v) => setFilters({ ...filters, paymentStatus: v })}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous paiements</SelectItem>
                <SelectItem value="pending">Non payé</SelectItem>
                <SelectItem value="paid">Payé</SelectItem>
                <SelectItem value="refunded">Remboursé</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-[150px]"
              placeholder="Du"
            />
            <Input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-[150px]"
              placeholder="Au"
            />
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Réservations ({bookings?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {bookingsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : bookings?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune réservation trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Paiement</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings?.map((booking) => {
                    const duration = differenceInDays(new Date(booking.end_date), new Date(booking.start_date)) + 1;
                    return (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-xs">{booking.id.slice(0, 8)}...</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{booking.client_name}</div>
                              {booking.client_phone && (
                                <div className="text-xs text-muted-foreground">{booking.client_phone}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{booking.vehicle_name}</div>
                          {booking.vehicle_brand && (
                            <div className="text-xs text-muted-foreground">{booking.vehicle_brand} {booking.vehicle_model}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(booking.start_date), 'dd/MM', { locale: fr })} → {format(new Date(booking.end_date), 'dd/MM', { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{duration} jour{duration > 1 ? 's' : ''}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {Number(booking.total_amount).toLocaleString()} CDF
                        </TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>{getPaymentBadge(booking.payment_status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleViewDetails(booking)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {booking.status === 'pending' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 text-xs"
                                  onClick={() => handleUpdateStatus(booking.id, 'approved_by_partner')}
                                >
                                  Approuver
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                                  onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                >
                                  Annuler
                                </Button>
                              </>
                            )}
                            {booking.status === 'approved_by_partner' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 text-xs"
                                onClick={() => handleUpdateStatus(booking.id, 'completed')}
                              >
                                Terminer
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de la réservation</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">ID</span>
                <span className="font-mono text-sm">{selectedBooking.id}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Client</span>
                  <p className="font-medium">{selectedBooking.client_name}</p>
                  {selectedBooking.client_phone && (
                    <p className="text-muted-foreground">{selectedBooking.client_phone}</p>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Véhicule</span>
                  <p className="font-medium">{selectedBooking.vehicle_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date début</span>
                  <p className="font-medium">{format(new Date(selectedBooking.start_date), 'dd MMMM yyyy', { locale: fr })}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date fin</span>
                  <p className="font-medium">{format(new Date(selectedBooking.end_date), 'dd MMMM yyyy', { locale: fr })}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Durée</span>
                  <p className="font-medium">{differenceInDays(new Date(selectedBooking.end_date), new Date(selectedBooking.start_date)) + 1} jours</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Montant total</span>
                  <p className="font-medium text-lg">{Number(selectedBooking.total_amount).toLocaleString()} CDF</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <span className="text-sm text-muted-foreground">Statut:</span>
                {getStatusBadge(selectedBooking.status)}
                <span className="text-sm text-muted-foreground ml-4">Paiement:</span>
                {getPaymentBadge(selectedBooking.payment_status)}
              </div>

              {selectedBooking.driver_name && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <span className="text-sm font-medium text-blue-700">Chauffeur assigné:</span>
                  <p className="text-sm text-blue-600 mt-1">{selectedBooking.driver_name} - {selectedBooking.driver_phone}</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Créée le {format(new Date(selectedBooking.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RentalBookingList;
