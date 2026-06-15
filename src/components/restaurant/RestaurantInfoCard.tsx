import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, MapPin, Clock, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RestaurantInfo {
  restaurant_name: string;
  city: string;
  address: string;
  minimum_order_amount: number;
  verification_status: string;
  created_at: string;
}

export function RestaurantInfoCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [info, setInfo] = useState<RestaurantInfo | null>(null);

  useEffect(() => {
    if (user) {
      loadInfo();
    }
  }, [user]);

  const loadInfo = async () => {
    try {
      const { data } = await supabase
        .from('restaurant_profiles')
        .select('restaurant_name, city, address, minimum_order_amount, verification_status, created_at')
        .eq('user_id', user!.id)
        .single();

      if (data) setInfo(data);
    } catch (error) {
      console.error('Error loading info:', error);
    }
  };

  if (!info) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Informations du restaurant</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/restaurant/profile')}
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Nom commercial</p>
            <p className="font-medium">{info.restaurant_name}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Statut</p>
            <Badge variant={info.verification_status === 'verified' ? 'default' : 'secondary'}>
              {info.verification_status === 'verified' ? 'Vérifié' : 'En attente'}
            </Badge>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Adresse
            </p>
            <p className="font-medium">{info.city}, {info.address}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Commande minimum
            </p>
            <p className="font-medium">{info.minimum_order_amount.toLocaleString()} CDF</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Membre depuis
            </p>
            <p className="font-medium">
              {new Date(info.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
