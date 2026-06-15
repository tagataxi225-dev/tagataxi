import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Store, MapPin, Phone, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const VendorInfoCard = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const { data: vendor } = useQuery({
    queryKey: ['vendor-profile-full', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Store className="h-5 w-5" />
          Informations Commerciales
        </h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Nom de la boutique</label>
            <p className="text-base">{vendor?.shop_name || 'Non renseigné'}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <p className="text-base">{vendor?.shop_description || 'Non renseigné'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Note moyenne</label>
            <p className="text-base">⭐ {vendor?.average_rating?.toFixed(1) || '0.0'} / 5</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email de contact
            </label>
            <p className="text-base">{user?.email || 'Non renseigné'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Store className="h-4 w-4" />
              Ventes totales
            </label>
            <p className="text-base">{vendor?.total_sales || 0} commandes</p>
          </div>

          {vendor?.created_at && (
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Membre depuis
              </label>
              <p className="text-base">
                {format(new Date(vendor.created_at), 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <span className="text-sm text-muted-foreground">Statut: </span>
            <Badge variant="default" className="bg-green-500">Actif</Badge>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Abonnés: </span>
            <Badge variant="secondary">{vendor?.follower_count || 0} followers</Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};
