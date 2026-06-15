import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star, MapPin, Clock, CheckCircle, Camera } from 'lucide-react';
import { toast } from 'sonner';

export const DriverProfileHeader: React.FC = () => {
  const { user } = useAuth();

  const { data: driverProfile } = useQuery({
    queryKey: ['driver-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chauffeurs')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handlePhotoUpload = () => {
    toast.info('Upload de photo - Bientôt disponible');
  };

  const initials = driverProfile?.display_name
    ? driverProfile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : 'CH';

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar avec bouton upload */}
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
              <AvatarImage src={driverProfile?.profile_photo_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="secondary"
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-lg"
              onClick={handlePhotoUpload}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          {/* Informations principales */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold truncate">
                  {driverProfile?.display_name || 'Chauffeur'}
                </h2>
                <p className="text-sm text-muted-foreground truncate">
                  {driverProfile?.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  {driverProfile?.phone_number}
                </p>
              </div>

              {/* Badge de vérification */}
              {driverProfile?.verification_status === 'verified' && (
                <Badge variant="default" className="bg-green-500 gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Vérifié
                </Badge>
              )}
            </div>

            {/* Statistiques compactes */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span className="font-semibold">
                  {driverProfile?.rating_average?.toFixed(1) || '0.0'}
                </span>
                <span className="text-muted-foreground">
                  ({driverProfile?.rating_count || 0})
                </span>
              </div>

              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{driverProfile?.total_rides || 0} courses</span>
              </div>

              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Membre depuis{' '}
                  {new Date(driverProfile?.created_at || '').toLocaleDateString('fr-FR', {
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {/* Type de service */}
            <div className="mt-3">
              <Badge variant="outline" className="text-xs">
                {driverProfile?.service_type === 'taxi' ? '🚗 VTC' : '📦 Livraison'}
              </Badge>
              {driverProfile?.vehicle_plate && (
                <Badge variant="outline" className="text-xs ml-2">
                  {driverProfile.vehicle_plate}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverProfileHeader;
