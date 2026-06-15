import { useState } from 'react';
import { UniversalAppHeader } from '@/components/navigation/UniversalAppHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ApproveAllRentalsButton } from '@/components/admin/ApproveAllRentalsButton';
import { PendingVehicleCard } from '@/components/admin/rental/PendingVehicleCard';
import { VehicleModerationModal } from '@/components/admin/rental/VehicleModerationModal';
import { RejectReasonDialog } from '@/components/admin/rental/RejectReasonDialog';
import { ModerationStats } from '@/components/admin/rental/ModerationStats';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Filter } from 'lucide-react';
import { invokeEdgeFunction } from '@/utils/edgeFunctionWrapper';

export default function AdminRentalModerationEnhanced() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [vehicleToReject, setVehicleToReject] = useState<any>(null);

  // Récupérer tous les véhicules avec statistiques
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['admin-rental-vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Enrichir avec les infos partenaire et catégorie
      const enrichedData = await Promise.all((data || []).map(async (v: any) => {
        let partnerName = '';
        let categoryName = '';

        if (v.partner_id) {
          const { data: partner } = await supabase
            .from('partenaires')
            .select('company_name')
            .eq('id', v.partner_id)
            .single();
          partnerName = partner?.company_name || '';
        }

        if (v.category_id) {
          const { data: category } = await supabase
            .from('rental_vehicle_categories')
            .select('name')
            .eq('id', v.category_id)
            .single();
          categoryName = category?.name || '';
        }

        return {
          id: v.id,
          name: v.name,
          brand: v.brand,
          model: v.model,
          year: v.year,
          daily_rate: v.daily_rate,
          currency: v.currency,
          city: v.city,
          images: Array.isArray(v.images) ? v.images : [],
          created_at: v.created_at,
          moderation_status: v.moderation_status,
          partner_name: partnerName,
          category_name: categoryName,
          license_plate: v.license_plate,
          features: Array.isArray(v.features) ? v.features : [],
          equipment: Array.isArray(v.equipment) ? v.equipment : [],
          seats: v.seats,
          fuel_type: v.fuel_type,
          transmission: v.transmission,
          weekly_rate: v.weekly_rate,
          security_deposit: v.security_deposit
        };
      }));

      return enrichedData;
    }
  });

  const stats = {
    total: vehicles?.length || 0,
    pending: vehicles?.filter(v => v.moderation_status === 'pending').length || 0,
    approved: vehicles?.filter(v => v.moderation_status === 'approved').length || 0,
    rejected: vehicles?.filter(v => v.moderation_status === 'rejected').length || 0
  };

  // Filtrer les véhicules
  const filterVehicles = (status: string) => {
    if (!vehicles) return [];
    
    let filtered = status === 'all' 
      ? vehicles 
      : vehicles.filter(v => v.moderation_status === status);

    if (searchQuery) {
      filtered = filtered.filter(v => 
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.partner_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  // Mutation approbation
  const approveMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      console.log('🚀 Appel admin-approve-vehicle pour:', vehicleId);

      const { data, error } = await invokeEdgeFunction({
        functionName: 'admin-approve-vehicle',
        body: { vehicle_id: vehicleId }
      });

      console.log('📡 Réponse edge function:', { data, error });

      if (error) {
        console.error('❌ Erreur invoke:', error);
        throw new Error(error.message || 'Erreur inconnue');
      }

      if (data?.error) {
        console.error('❌ Erreur dans data:', data.error);
        throw new Error(data.error);
      }

      if (!data?.success) {
        console.error('❌ Succès non confirmé:', data);
        throw new Error('La fonction n\'a pas confirmé le succès');
      }

      console.log('✅ Véhicule approuvé:', data.vehicle);
      return data;
    },
    onSuccess: () => {
      toast({
        title: '✅ Véhicule approuvé',
        description: 'Le véhicule est maintenant visible par les clients'
      });
      queryClient.invalidateQueries({ queryKey: ['admin-rental-vehicles'] });
    },
    onError: (error: any) => {
      console.error('❌ ERREUR FINALE mutation:', error);
      toast({
        title: '❌ Erreur d\'approbation',
        description: error.message || 'Impossible d\'approuver le véhicule',
        variant: 'destructive'
      });
    }
  });

  // Mutation rejet
  const rejectMutation = useMutation({
    mutationFn: async ({ vehicleId, reason }: { vehicleId: string; reason: string }) => {
      console.log('🚀 Appel admin-reject-vehicle pour:', vehicleId, 'raison:', reason);

      const { data, error } = await invokeEdgeFunction({
        functionName: 'admin-reject-vehicle',
        body: { vehicle_id: vehicleId, reason }
      });

      console.log('📡 Réponse edge function:', { data, error });

      if (error) {
        console.error('❌ Erreur invoke:', error);
        throw new Error(error.message || 'Erreur inconnue');
      }

      if (data?.error) {
        console.error('❌ Erreur dans data:', data.error);
        throw new Error(data.error);
      }

      if (!data?.success) {
        console.error('❌ Succès non confirmé:', data);
        throw new Error('La fonction n\'a pas confirmé le succès');
      }

      console.log('✅ Véhicule rejeté:', data.vehicle);
      return data;
    },
    onSuccess: () => {
      toast({
        title: '❌ Véhicule rejeté',
        description: 'Le partenaire a été notifié'
      });
      queryClient.invalidateQueries({ queryKey: ['admin-rental-vehicles'] });
      setRejectDialogOpen(false);
      setVehicleToReject(null);
    },
    onError: (error: any) => {
      console.error('❌ ERREUR FINALE mutation:', error);
      toast({
        title: '❌ Erreur de rejet',
        description: error.message || 'Impossible de rejeter le véhicule',
        variant: 'destructive'
      });
    }
  });

  const handleApprove = (vehicleId: string) => {
    approveMutation.mutate(vehicleId);
  };

  const handleReject = (vehicleId: string) => {
    const vehicle = vehicles?.find(v => v.id === vehicleId);
    setVehicleToReject(vehicle);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = (reason: string) => {
    if (vehicleToReject) {
      rejectMutation.mutate({ vehicleId: vehicleToReject.id, reason });
    }
  };

  const handleViewDetails = (vehicleId: string) => {
    const vehicle = vehicles?.find(v => v.id === vehicleId);
    setSelectedVehicle(vehicle);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <UniversalAppHeader title="Modération Location" showBackButton={true} />

      <div className="max-w-7xl mx-auto p-4 pt-20 space-y-6">
        {/* Statistiques */}
        <ModerationStats stats={stats} />

        {/* Actions rapides */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h3 className="font-semibold">⚡ Actions rapides</h3>
              <p className="text-sm text-muted-foreground">
                Gérer les véhicules en attente de modération
              </p>
            </div>
            <ApproveAllRentalsButton />
          </div>
        </Card>

        {/* Recherche */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, marque, modèle, partenaire..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs par statut */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              En attente ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approuvés ({stats.approved})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejetés ({stats.rejected})
            </TabsTrigger>
            <TabsTrigger value="all">
              Tous ({stats.total})
            </TabsTrigger>
          </TabsList>

          {['pending', 'approved', 'rejected', 'all'].map(status => (
            <TabsContent key={status} value={status} className="space-y-4 mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filterVehicles(status).length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">
                    Aucun véhicule {status === 'all' ? '' : status === 'pending' ? 'en attente' : status === 'approved' ? 'approuvé' : 'rejeté'}
                  </p>
                </Card>
              ) : (
                filterVehicles(status).map(vehicle => (
                  <PendingVehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onViewDetails={handleViewDetails}
                    isLoading={approveMutation.isPending || rejectMutation.isPending}
                  />
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Modals */}
      <VehicleModerationModal
        vehicle={selectedVehicle}
        open={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
      />

      <RejectReasonDialog
        open={rejectDialogOpen}
        onClose={() => {
          setRejectDialogOpen(false);
          setVehicleToReject(null);
        }}
        onConfirm={handleConfirmReject}
        vehicleName={vehicleToReject?.name || ''}
        isLoading={rejectMutation.isPending}
      />
    </div>
  );
}