import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useRentalAnalytics, RentalVehicleFilters } from '@/hooks/useRentalAnalytics';
import { 
  Car, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Search,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Filter,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const RentalVehicleList = () => {
  const { 
    useVehicles, 
    useVehicleStats, 
    useCategories,
    useCities,
    approveVehicle, 
    rejectVehicle,
    toggleVehicleAvailability 
  } = useRentalAnalytics();

  const [filters, setFilters] = useState<RentalVehicleFilters>({
    status: 'all',
    availability: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const { data: vehicles, isLoading: vehiclesLoading, refetch } = useVehicles({
    ...filters,
    search: searchTerm
  });
  const { data: stats, isLoading: statsLoading } = useVehicleStats();
  const { data: categories } = useCategories();
  const { data: cities } = useCities();

  const handleApprove = (vehicleId: string) => {
    approveVehicle.mutate(vehicleId);
  };

  const handleOpenRejectDialog = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (selectedVehicleId && rejectReason.trim()) {
      rejectVehicle.mutate({ vehicleId: selectedVehicleId, reason: rejectReason });
      setRejectDialogOpen(false);
    }
  };

  const handleToggleAvailability = (vehicleId: string, currentValue: boolean) => {
    toggleVehicleAvailability.mutate({ vehicleId, available: !currentValue });
  };

  const handleViewDetails = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setDetailsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Approuvé</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">En attente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Rejeté</Badge>;
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
                  <Car className="h-4 w-4" />
                  Total
                </div>
                <div className="text-2xl font-bold mt-1">{stats?.total || 0}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Approuvés
                </div>
                <div className="text-2xl font-bold mt-1 text-green-600">{stats?.approved || 0}</div>
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
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Rejetés
                </div>
                <div className="text-2xl font-bold mt-1 text-red-600">{stats?.rejected || 0}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Eye className="h-4 w-4 text-blue-500" />
                  Disponibles
                </div>
                <div className="text-2xl font-bold mt-1 text-blue-600">{stats?.available || 0}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un véhicule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v as any })}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvés</SelectItem>
                <SelectItem value="rejected">Rejetés</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.category || 'all'} onValueChange={(v) => setFilters({ ...filters, category: v === 'all' ? undefined : v })}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories?.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.availability} onValueChange={(v) => setFilters({ ...filters, availability: v as any })}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Disponibilité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="available">Disponibles</SelectItem>
                <SelectItem value="unavailable">Indisponibles</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Liste des Véhicules ({vehicles?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {vehiclesLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : vehicles?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun véhicule trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Tarif/jour</TableHead>
                    <TableHead>Partenaire</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Disponible</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles?.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {vehicle.image_url ? (
                            <img src={vehicle.image_url} alt={vehicle.name} className="h-10 w-14 rounded object-cover" />
                          ) : (
                            <div className="h-10 w-14 rounded bg-muted flex items-center justify-center">
                              <Car className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{vehicle.name || `${vehicle.brand} ${vehicle.model}`}</div>
                            <div className="text-xs text-muted-foreground">{vehicle.license_plate}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{vehicle.category_name}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {Number(vehicle.daily_rate).toLocaleString()} CDF
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{vehicle.partner_name}</div>
                          <div className="text-xs text-muted-foreground">{vehicle.city}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(vehicle.moderation_status)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={vehicle.is_available}
                          onCheckedChange={() => handleToggleAvailability(vehicle.id, vehicle.is_available)}
                          disabled={vehicle.moderation_status !== 'approved'}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleViewDetails(vehicle)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {vehicle.moderation_status === 'pending' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleApprove(vehicle.id)}
                                disabled={approveVehicle.isPending}
                              >
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleOpenRejectDialog(vehicle.id)}
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter le véhicule</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Raison du rejet</label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Expliquez pourquoi ce véhicule est rejeté..."
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Annuler</Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectVehicle.isPending}
            >
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails du véhicule</DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-4">
              {selectedVehicle.image_url && (
                <img 
                  src={selectedVehicle.image_url} 
                  alt={selectedVehicle.name} 
                  className="w-full h-48 rounded-lg object-cover"
                />
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Nom</span>
                  <p className="font-medium">{selectedVehicle.name || `${selectedVehicle.brand} ${selectedVehicle.model}`}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Plaque</span>
                  <p className="font-medium">{selectedVehicle.license_plate}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Année</span>
                  <p className="font-medium">{selectedVehicle.year}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tarif/jour</span>
                  <p className="font-medium">{Number(selectedVehicle.daily_rate).toLocaleString()} CDF</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Catégorie</span>
                  <p className="font-medium">{selectedVehicle.category_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Partenaire</span>
                  <p className="font-medium">{selectedVehicle.partner_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Ville</span>
                  <p className="font-medium">{selectedVehicle.city}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Créé le</span>
                  <p className="font-medium">{format(new Date(selectedVehicle.created_at), 'dd MMM yyyy', { locale: fr })}</p>
                </div>
              </div>
              {selectedVehicle.rejection_reason && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <span className="text-sm font-medium text-red-700">Raison du rejet:</span>
                  <p className="text-sm text-red-600 mt-1">{selectedVehicle.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RentalVehicleList;
