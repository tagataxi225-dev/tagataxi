/**
 * 🚗 Card affichant le véhicule assigné au chauffeur
 */

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AssignedVehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  color: string;
  vehicle_class: string;
}

export const VehicleAssignmentCard = () => {
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<AssignedVehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignedVehicle();
  }, [user]);

  const loadAssignedVehicle = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('partner_taxi_vehicles')
        .select('*')
        .eq('assigned_driver_id', user.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading assigned vehicle:', error);
      }

      setVehicle(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (!vehicle) {
    return (
      <Card className="p-6 bg-muted/30 border-dashed">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Aucun véhicule assigné
            </p>
            <p className="text-xs text-muted-foreground">
              Contactez votre partenaire pour qu'il vous assigne un véhicule
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Car className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-foreground">{vehicle.name}</h3>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
              Assigné
            </Badge>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">{vehicle.brand} {vehicle.model}</span> • {vehicle.year}
            </p>
            <p className="text-muted-foreground">
              Plaque: <span className="font-mono font-medium text-foreground">{vehicle.license_plate}</span>
            </p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {vehicle.vehicle_class?.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {vehicle.color}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};