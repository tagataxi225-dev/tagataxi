import React from 'react';
import { Building2, MapPin, Calendar, Shield, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const PartnerCompanyInfo: React.FC = () => {
  const { user } = useAuth();

  const { data: partner, isLoading } = useQuery({
    queryKey: ['partner-company-info', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partenaires')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <Card className="card-floating animate-pulse">
        <CardContent className="p-6">
          <div className="h-48 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-floating border-0">
      <CardHeader>
        <CardTitle className="text-heading-md flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Informations de l'entreprise
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nom commercial */}
        <div className="flex items-start justify-between pb-3 border-b">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-body-sm text-muted-foreground">Nom commercial</p>
              <p className="text-body-md font-semibold text-card-foreground">
                {partner?.company_name || 'Non renseigné'}
              </p>
            </div>
          </div>
        </div>

        {/* Type d'activité */}
        <div className="flex items-start justify-between pb-3 border-b">
          <div className="flex items-center gap-3">
            <Briefcase className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-body-sm text-muted-foreground">Type d'activité</p>
              <p className="text-body-md font-semibold text-card-foreground">
                {partner?.business_type || 'Non renseigné'}
              </p>
            </div>
          </div>
        </div>

        {/* Zones desservies */}
        <div className="flex items-start justify-between pb-3 border-b">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-body-sm text-muted-foreground">Zones desservies</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {partner?.service_areas && partner.service_areas.length > 0 ? (
                  partner.service_areas.map((area: string, index: number) => (
                    <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {area}
                    </Badge>
                  ))
                ) : (
                  <span className="text-body-md text-muted-foreground">Non renseigné</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statut de vérification */}
        <div className="flex items-start justify-between pb-3 border-b">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-body-sm text-muted-foreground">Statut de vérification</p>
              <div className="mt-1">
                {partner?.verification_status === 'verified' && (
                  <Badge className="bg-green-500">Vérifié</Badge>
                )}
                {partner?.verification_status === 'pending' && (
                  <Badge variant="secondary">En attente</Badge>
                )}
                {partner?.verification_status === 'rejected' && (
                  <Badge variant="destructive">Rejeté</Badge>
                )}
                {!partner?.verification_status && (
                  <Badge variant="outline">Non vérifié</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Membre depuis */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-body-sm text-muted-foreground">Membre depuis</p>
              <p className="text-body-md font-semibold text-card-foreground">
                {partner?.created_at
                  ? format(new Date(partner.created_at), 'dd MMMM yyyy', { locale: fr })
                  : 'Non renseigné'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
