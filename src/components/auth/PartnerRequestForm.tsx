import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building2, MapPin, Phone, Mail } from 'lucide-react';

interface Partner {
  id: string;
  user_id: string;
  company_name: string;
  display_name: string;
  business_type: string;
  email: string;
  phone_number: string;
  address: string;
  verification_status: string;
  commission_rate: number;
}

interface PartnerRequestFormProps {
  driverId: string;
  serviceCategory: 'taxi' | 'delivery';
  onRequestSent?: () => void;
}

export const PartnerRequestForm: React.FC<PartnerRequestFormProps> = ({
  driverId,
  serviceCategory,
  onRequestSent
}) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  useEffect(() => {
    loadAvailablePartners();
  }, [serviceCategory]);

  const loadAvailablePartners = async () => {
    try {
      let query = supabase
        .from('partenaires')
        .select('*')
        .eq('is_active', true)
        .in('verification_status', ['verified', 'approved', 'active']);

      if (serviceCategory === 'delivery') {
        query = query.eq('business_type', 'delivery');
      } else {
        query = query.in('business_type', ['transport', 'company', 'taxi']);
      }

      const { data, error } = await query.limit(10);

      if (error) throw error;

      setPartners(data || []);
    } catch (error) {
      console.error('Error loading partners:', error);
      toast.error('Erreur lors du chargement des partenaires');
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (partnerId: string) => {
    setSendingTo(partnerId);
    try {
      const { error } = await supabase
        .from('partner_driver_requests')
        .insert({
          driver_id: driverId,
          partner_id: partnerId,
          request_message: requestMessage.trim() || 'Demande de partenariat',
          status: 'pending'
        });

      if (error) throw error;
      
      toast.success('Demande envoyée avec succès !');
      setRequestMessage('');
      onRequestSent?.();
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error('Erreur lors de l\'envoi de la demande');
    } finally {
      setSendingTo(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Chargement des partenaires...</p>
      </div>
    );
  }

  if (partners.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun partenaire disponible</h3>
          <p className="text-muted-foreground">
            Il n'y a actuellement aucun partenaire vérifié dans votre zone.
            Réessayez plus tard ou contactez notre support.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Partenaires disponibles</h3>
        <p className="text-muted-foreground">
          Trouvez un partenaire pour commencer à travailler avec leurs véhicules
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Message de présentation
        </label>
        <Textarea
          value={requestMessage}
          onChange={(e) => setRequestMessage(e.target.value)}
          placeholder="Présentez-vous brièvement et expliquez pourquoi vous souhaitez rejoindre ce partenaire..."
          rows={4}
          className="mb-4"
        />
      </div>

      <div className="grid gap-4">
        {partners.map((partner) => (
          <Card key={partner.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>
                      {partner.company_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{partner.company_name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {partner.business_type}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {partner.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {partner.phone_number}
                      </div>
                      {partner.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {partner.address}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3">
                      <span className="text-sm">
                        Commission: <span className="font-medium">{partner.commission_rate}%</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => sendRequest(partner.user_id)}
                  disabled={sendingTo === partner.user_id}
                  size="sm"
                >
                  {sendingTo === partner.user_id ? 'Envoi...' : 'Envoyer demande'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};