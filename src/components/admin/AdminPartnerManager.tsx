import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Search, CheckCircle, XCircle, Building2, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { PartnerAuditTrail } from './partners/PartnerAuditTrail';
import { PartnerRegistrationTest } from './partners/PartnerRegistrationTest';
import { PartnerNotifications } from './partners/PartnerNotifications';

interface Partner {
  id: string;
  user_id: string;
  display_name: string;
  phone_number: string;
  email: string;
  address: string;
  business_type: string;
  service_areas?: string[];
  commission_rate: number;
  is_active: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
  company_name: string;
  company_registration_number?: string;
  contact_person_name?: string;
  bank_account_number?: string;
  city?: string;
}

const AdminPartnerManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const queryClient = useQueryClient();

  // Fetch partners
  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['admin-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partenaires')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Partner[];
    }
  });

  // Update partner status mutation
  const updatePartnerStatus = useMutation({
    mutationFn: async ({ id, status, is_active }: { id: string; status: string; is_active: boolean }) => {
      console.log('🔄 [AdminPartnerManager] Updating partner status:', { id, status, is_active });
      
      const { data, error } = await supabase
        .from('partenaires')
        .update({ 
          verification_status: status,
          is_active: is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ [AdminPartnerManager] Update error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('✅ [AdminPartnerManager] Partner updated:', data);
      
      // Envoyer la notification via Edge Function
      if (status === 'verified' || status === 'rejected') {
        try {
          const { data: session } = await supabase.auth.getSession();
          if (session?.session?.access_token) {
            await supabase.functions.invoke('partner-validation-notification', {
              body: {
                partner_id: id,
                action: status === 'verified' ? 'approved' : 'rejected',
                reason: status === 'rejected' ? 'Rejeté par l\'administrateur' : undefined
              }
            });
            console.log('✅ Notification sent to partner');
          }
        } catch (notifError) {
          console.error('⚠️ Failed to send notification:', notifError);
          // Ne pas faire échouer la mutation pour une erreur de notification
        }
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      toast.success('Statut du partenaire mis à jour', {
        description: `${data.company_name} est maintenant ${data.verification_status === 'verified' ? 'vérifié' : data.verification_status}`
      });
    },
    onError: (error: any) => {
      console.error('❌ [AdminPartnerManager] Mutation error:', error);
      
      let errorMessage = 'Erreur lors de la mise à jour';
      let errorDescription = '';
      
      // Messages d'erreur spécifiques
      if (error.code === '23514') {
        errorMessage = 'Valeur de statut invalide';
        errorDescription = 'La valeur de statut doit être: pending, verified ou rejected';
      } else if (error.code === '42501') {
        errorMessage = 'Permissions insuffisantes';
        errorDescription = 'Vous n\'avez pas les droits pour modifier ce partenaire';
      } else if (error.message) {
        errorMessage = error.message;
        errorDescription = error.hint || '';
      }
      
      toast.error(errorMessage, {
        description: errorDescription || 'Contactez le support si le problème persiste'
      });
    }
  });

  const handleApprove = (partnerId: string) => {
    updatePartnerStatus.mutate({ 
      id: partnerId, 
      status: 'verified', 
      is_active: true 
    });
  };

  const handleReject = (partnerId: string) => {
    updatePartnerStatus.mutate({ 
      id: partnerId, 
      status: 'rejected', 
      is_active: false 
    });
  };

  const handleToggleActive = (partnerId: string, currentStatus: boolean) => {
    updatePartnerStatus.mutate({ 
      id: partnerId, 
      status: 'verified', 
      is_active: !currentStatus 
    });
  };

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = 
      partner.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.phone_number.includes(searchTerm);

    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'pending' && partner.verification_status === 'pending') ||
      (activeTab === 'verified' && partner.verification_status === 'verified') ||
      (activeTab === 'rejected' && partner.verification_status === 'rejected');

    return matchesSearch && matchesTab;
  });

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (status === 'pending') {
      return <Badge variant="secondary">En attente</Badge>;
    }
    if (status === 'verified' && isActive) {
      return <Badge variant="default" className="bg-green-600">Actif</Badge>;
    }
    if (status === 'verified' && !isActive) {
      return <Badge variant="outline">Vérifié (Inactif)</Badge>;
    }
    if (status === 'rejected') {
      return <Badge variant="destructive">Rejeté</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const renderPartnerCard = (partner: Partner) => (
    <Card key={partner.id} className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {partner.company_name}
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(partner.created_at).toLocaleDateString('fr-FR')}
              </span>
              {getStatusBadge(partner.verification_status, partner.is_active)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {partner.email}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {partner.phone_number}
            </div>
            {partner.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {partner.address}
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div><strong>Type:</strong> {partner.business_type}</div>
            <div><strong>Commission:</strong> {partner.commission_rate}%</div>
            <div><strong>Zones:</strong> {partner.service_areas?.join(', ') || 'N/A'}</div>
            {partner.company_registration_number && (
              <div><strong>Licence:</strong> {partner.company_registration_number}</div>
            )}
            {partner.contact_person_name && (
              <div><strong>Contact:</strong> {partner.contact_person_name}</div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {partner.verification_status === 'pending' && (
            <>
              <Button
                size="sm"
                onClick={() => handleApprove(partner.id)}
                disabled={updatePartnerStatus.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approuver
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleReject(partner.id)}
                disabled={updatePartnerStatus.isPending}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Rejeter
              </Button>
            </>
          )}

          {partner.verification_status === 'verified' && (
            <Button
              size="sm"
              variant={partner.is_active ? "destructive" : "default"}
              onClick={() => handleToggleActive(partner.id, partner.is_active)}
              disabled={updatePartnerStatus.isPending}
            >
              {partner.is_active ? 'Désactiver' : 'Activer'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const stats = {
    total: partners.length,
    pending: partners.filter(p => p.verification_status === 'pending').length,
    verified: partners.filter(p => p.verification_status === 'verified').length,
    active: partners.filter(p => p.is_active).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gestion des Partenaires</h2>
        <p className="text-muted-foreground">
          Gérez les demandes de partenariat et les comptes partenaires existants
        </p>
      </div>

      <Tabs defaultValue="partners" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="partners">Partenaires</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="test">Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total partenaires</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">En attente</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.verified}</div>
                <div className="text-sm text-muted-foreground">Vérifiés</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <div className="text-sm text-muted-foreground">Actifs</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un partenaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Partner Status Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending">En attente ({stats.pending})</TabsTrigger>
              <TabsTrigger value="verified">Vérifiés ({stats.verified})</TabsTrigger>
              <TabsTrigger value="all">Tous ({stats.total})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : filteredPartners.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun partenaire trouvé
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPartners.map(renderPartnerCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <PartnerNotifications />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <PartnerAuditTrail />
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <PartnerRegistrationTest />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPartnerManager;