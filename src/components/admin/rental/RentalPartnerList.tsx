import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRentalAnalytics, RentalPartnerFilters } from '@/hooks/useRentalAnalytics';
import { 
  Building2,
  CheckCircle, 
  Clock, 
  Search,
  Eye,
  RefreshCw,
  Filter,
  Car,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Shield,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const RentalPartnerList = () => {
  const { usePartners, usePartnerStats, useCities, togglePartnerActive, verifyPartner } = useRentalAnalytics();

  const [filters, setFilters] = useState<RentalPartnerFilters>({
    verificationStatus: 'all',
    activeOnly: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);

  const { data: partners, isLoading: partnersLoading, refetch } = usePartners({
    ...filters,
    search: searchTerm
  });
  const { data: stats, isLoading: statsLoading } = usePartnerStats();
  const { data: cities } = useCities();

  const handleViewDetails = (partner: any) => {
    setSelectedPartner(partner);
    setDetailsDialogOpen(true);
  };

  const handleToggleActive = (partnerId: string, currentActive: boolean) => {
    togglePartnerActive.mutate({ partnerId, active: !currentActive });
  };

  const handleVerify = (partnerId: string) => {
    verifyPartner.mutate(partnerId);
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30"><Shield className="h-3 w-3 mr-1" />Vérifié</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Rejeté</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsLoading ? (
          [...Array(4)].map((_, i) => (
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
                  <Building2 className="h-4 w-4" />
                  Total partenaires
                </div>
                <div className="text-2xl font-bold mt-1">{stats?.total || 0}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Shield className="h-4 w-4 text-green-500" />
                  Vérifiés
                </div>
                <div className="text-2xl font-bold mt-1 text-green-600">{stats?.verified || 0}</div>
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
                  <Users className="h-4 w-4 text-blue-500" />
                  Actifs
                </div>
                <div className="text-2xl font-bold mt-1 text-blue-600">{stats?.active || 0}</div>
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
                placeholder="Rechercher un partenaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filters.verificationStatus} onValueChange={(v) => setFilters({ ...filters, verificationStatus: v })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Vérification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="verified">Vérifiés</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.city || 'all'} onValueChange={(v) => setFilters({ ...filters, city: v === 'all' ? undefined : v })}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Ville" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes villes</SelectItem>
                {cities?.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch
                checked={filters.activeOnly}
                onCheckedChange={(checked) => setFilters({ ...filters, activeOnly: checked })}
              />
              <span className="text-sm text-muted-foreground">Actifs seulement</span>
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Partners Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Partenaires ({partners?.length || 0})</h3>
        
        {partnersLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-12 w-12 rounded-full mb-4" />
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : partners?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun partenaire trouvé</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {partners?.map((partner) => (
              <Card key={partner.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{partner.company_name}</h4>
                        <p className="text-sm text-muted-foreground">{partner.display_name}</p>
                      </div>
                    </div>
                    <Switch
                      checked={partner.is_active}
                      onCheckedChange={() => handleToggleActive(partner.id, partner.is_active)}
                    />
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {partner.city || 'Ville non renseignée'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {partner.phone_number}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      {partner.email}
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 mb-4 py-3 border-y">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Car className="h-3.5 w-3.5" />
                      </div>
                      <div className="font-semibold">{partner.vehicles_count}</div>
                      <div className="text-xs text-muted-foreground">Véhicules</div>
                    </div>
                    <div className="text-center border-x">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                      </div>
                      <div className="font-semibold">{partner.bookings_count}</div>
                      <div className="text-xs text-muted-foreground">Réservations</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <DollarSign className="h-3.5 w-3.5" />
                      </div>
                      <div className="font-semibold text-sm">{(partner.total_revenue / 1000).toFixed(0)}k</div>
                      <div className="text-xs text-muted-foreground">CDF</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {getVerificationBadge(partner.verification_status)}
                    <div className="flex gap-1">
                      {partner.verification_status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-green-600 border-green-300 hover:bg-green-50"
                          onClick={() => handleVerify(partner.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Vérifier
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleViewDetails(partner)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails du partenaire</DialogTitle>
          </DialogHeader>
          {selectedPartner && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedPartner.company_name}</h3>
                  <p className="text-muted-foreground">{selectedPartner.display_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Email</span>
                  <p className="font-medium">{selectedPartner.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Téléphone</span>
                  <p className="font-medium">{selectedPartner.phone_number}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Ville</span>
                  <p className="font-medium">{selectedPartner.city || 'Non renseignée'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Inscrit le</span>
                  <p className="font-medium">{format(new Date(selectedPartner.created_at), 'dd MMM yyyy', { locale: fr })}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/50">
                <div className="text-center">
                  <Car className="h-5 w-5 mx-auto text-primary mb-1" />
                  <div className="text-2xl font-bold">{selectedPartner.vehicles_count}</div>
                  <div className="text-xs text-muted-foreground">Véhicules</div>
                </div>
                <div className="text-center border-x">
                  <Calendar className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                  <div className="text-2xl font-bold">{selectedPartner.bookings_count}</div>
                  <div className="text-xs text-muted-foreground">Réservations</div>
                </div>
                <div className="text-center">
                  <DollarSign className="h-5 w-5 mx-auto text-green-500 mb-1" />
                  <div className="text-2xl font-bold">{selectedPartner.total_revenue.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">CDF gagnés</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Statut:</span>
                  {getVerificationBadge(selectedPartner.verification_status)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Actif:</span>
                  <Switch
                    checked={selectedPartner.is_active}
                    onCheckedChange={() => handleToggleActive(selectedPartner.id, selectedPartner.is_active)}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RentalPartnerList;
