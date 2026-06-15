import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, User, Car, Package } from 'lucide-react';

interface DriverRequest {
  id: string;
  user_id: string;
  vehicle_type: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_year: number;
  license_number: string;
  license_expiry: string;
  insurance_number: string;
  service_type: string;
  status: string;
  created_at: string;
  profiles?: {
    display_name: string;
    phone_number: string;
    avatar_url: string;
  };
}

export const AdminDriverModeration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingDrivers, isLoading } = useQuery<DriverRequest[]>({
    queryKey: ['pending-driver-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_requests')
        .select(`
          *,
          profiles:user_id (
            display_name,
            phone_number,
            avatar_url
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map((item: any) => ({
        ...item,
        profiles: item.profiles || { display_name: '', phone_number: '', avatar_url: '' }
      })) as DriverRequest[];
    }
  });

  const moderateDriver = useMutation({
    mutationFn: async ({ driverId, action }: { driverId: string; action: 'approve' | 'reject' }) => {
      const { error } = await supabase.functions.invoke('admin-operations', {
        body: {
          operation: 'moderate_driver',
          driver_id: driverId,
          action
        }
      });
      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      toast({
        title: action === 'approve' ? 'Chauffeur approuvé' : 'Chauffeur rejeté',
        description: `La demande a été ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès.`,
      });
      queryClient.invalidateQueries({ queryKey: ['pending-driver-requests'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la modération.',
        variant: 'destructive',
      });
      console.error('Moderation error:', error);
    }
  });

  const getServiceTypeIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'taxi': return <Car className="h-4 w-4" />;
      case 'delivery': return <Package className="h-4 w-4" />;
      case 'both': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getServiceTypeLabel = (serviceType: string) => {
    switch (serviceType) {
      case 'taxi': return 'Taxi';
      case 'delivery': return 'Livraison';
      case 'both': return 'Complet';
      default: return serviceType;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Modération des Chauffeurs</h2>
        <Badge variant="secondary">
          {pendingDrivers?.length || 0} en attente
        </Badge>
      </div>

      {!pendingDrivers?.length ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Aucune demande en attente</p>
              <p className="text-muted-foreground">Toutes les demandes ont été traitées.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingDrivers.map((driver) => (
            <Card key={driver.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={driver.profiles?.avatar_url} />
                    <AvatarFallback>
                      {driver.profiles?.display_name?.charAt(0) || 'D'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {driver.profiles?.display_name || 'Chauffeur'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getServiceTypeIcon(driver.service_type)}
                        <span className="ml-1">{getServiceTypeLabel(driver.service_type)}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Téléphone:</span>
                    <span className="ml-2">{driver.profiles?.phone_number || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Véhicule:</span>
                    <span className="ml-2">{driver.vehicle_type} {driver.vehicle_model} ({driver.vehicle_year})</span>
                  </div>
                  <div>
                    <span className="font-medium">Plaque:</span>
                    <span className="ml-2 font-mono">{driver.vehicle_plate}</span>
                  </div>
                  <div>
                    <span className="font-medium">Permis:</span>
                    <span className="ml-2">{driver.license_number}</span>
                  </div>
                  <div>
                    <span className="font-medium">Assurance:</span>
                    <span className="ml-2">{driver.insurance_number}</span>
                  </div>
                  <div>
                    <span className="font-medium">Demande:</span>
                    <span className="ml-2">{new Date(driver.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => moderateDriver.mutate({ driverId: driver.id, action: 'reject' })}
                    disabled={moderateDriver.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rejeter
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => moderateDriver.mutate({ driverId: driver.id, action: 'approve' })}
                    disabled={moderateDriver.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approuver
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};