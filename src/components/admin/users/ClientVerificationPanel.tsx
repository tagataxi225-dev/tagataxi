import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Shield,
  Phone,
  FileText,
  User
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ClientVerification {
  user_id: string;
  display_name: string;
  email: string;
  phone_number: string;
  phone_verified: boolean;
  identity_verified: boolean;
  verification_status: string;
  verification_level: string;
  verified_at: string | null;
  created_at: string;
  identity_document_url: string | null;
}

export const ClientVerificationPanel: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<ClientVerification | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'level' | 'force' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newLevel, setNewLevel] = useState<string>('basic');

  // Récupérer les clients avec leur statut de vérification
  const { data: clients, isLoading } = useQuery({
    queryKey: ['client-verifications', searchTerm, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('user_verification')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('verification_status', filterStatus);
      }

      const { data: verifications, error } = await query;
      if (error) throw error;

      // Récupérer les données des clients séparément
      const results: ClientVerification[] = [];
      
      for (const verification of verifications || []) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('display_name, email, phone_number')
          .eq('user_id', verification.user_id)
          .maybeSingle();

        results.push({
          user_id: verification.user_id,
          display_name: clientData?.display_name || 'N/A',
          email: clientData?.email || 'N/A',
          phone_number: clientData?.phone_number || 'N/A',
          phone_verified: verification.phone_verified,
          identity_verified: verification.identity_verified,
          verification_status: verification.verification_status || 'pending',
          verification_level: verification.verification_level || 'none',
          verified_at: verification.verified_at,
          created_at: verification.created_at,
          identity_document_url: verification.identity_document_url
        });
      }

      return results;
    }
  });

  // Mutation pour approuver
  const approveMutation = useMutation({
    mutationFn: async ({ userId, notes }: { userId: string; notes: string }) => {
      const { data, error } = await supabase.rpc('approve_client_for_selling', {
        p_user_id: userId,
        p_admin_notes: notes
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-verifications'] });
      toast({
        title: 'Client approuvé',
        description: 'Le client peut maintenant vendre sur la marketplace',
      });
      closeDialog();
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible d'approuver le client: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Mutation pour rejeter
  const rejectMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const { data, error } = await supabase.rpc('reject_client_verification', {
        p_user_id: userId,
        p_rejection_reason: reason
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-verifications'] });
      toast({
        title: 'Vérification rejetée',
        description: 'Le client a été notifié',
      });
      closeDialog();
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de rejeter: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Mutation pour changer le niveau
  const updateLevelMutation = useMutation({
    mutationFn: async ({ userId, level, notes }: { userId: string; level: string; notes: string }) => {
      const { data, error } = await supabase.rpc('update_verification_level', {
        p_user_id: userId,
        p_new_level: level,
        p_admin_notes: notes
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-verifications'] });
      toast({
        title: 'Niveau mis à jour',
        description: 'Le niveau de vérification a été modifié',
      });
      closeDialog();
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de mettre à jour: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Mutation pour forcer l'activation (debug)
  const forceActivateMutation = useMutation({
    mutationFn: async ({ userId, notes }: { userId: string; notes: string }) => {
      const { data, error } = await supabase.rpc('force_activate_seller', {
        p_user_id: userId,
        p_admin_notes: notes
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-verifications'] });
      toast({
        title: '✅ Vendeur activé avec force',
        description: 'Le compte vendeur a été forcé avec succès',
      });
      closeDialog();
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de forcer l'activation: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  const openDialog = (client: ClientVerification, type: 'approve' | 'reject' | 'level' | 'force') => {
    setSelectedClient(client);
    setActionType(type);
    setAdminNotes('');
    setNewLevel('basic');
  };

  const closeDialog = () => {
    setSelectedClient(null);
    setActionType(null);
    setAdminNotes('');
  };

  const handleAction = () => {
    if (!selectedClient) return;

    switch (actionType) {
      case 'approve':
        approveMutation.mutate({ userId: selectedClient.user_id, notes: adminNotes });
        break;
      case 'reject':
        rejectMutation.mutate({ userId: selectedClient.user_id, reason: adminNotes });
        break;
      case 'level':
        updateLevelMutation.mutate({ 
          userId: selectedClient.user_id, 
          level: newLevel, 
          notes: adminNotes 
        });
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeté</Badge>;
      case 'pending_review':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />En révision</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
    }
  };

  const getLevelBadge = (level: string) => {
    const colors = {
      none: 'bg-gray-500',
      basic: 'bg-blue-500',
      full: 'bg-purple-500'
    };
    return <Badge className={colors[level as keyof typeof colors] || 'bg-gray-500'}>{level}</Badge>;
  };

  const filteredClients = clients?.filter(client => 
    client.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: clients?.length || 0,
    pending: clients?.filter(c => c.verification_status === 'pending_review').length || 0,
    approved: clients?.filter(c => c.verification_status === 'approved').length || 0,
    rejected: clients?.filter(c => c.verification_status === 'rejected').length || 0,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Vérification des clients vendeurs
          </CardTitle>
          <CardDescription>
            Gérez les demandes de vérification pour accéder à la marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card className="border-yellow-500/30">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </CardContent>
            </Card>
            <Card className="border-green-500/30">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Approuvés</p>
              </CardContent>
            </Card>
            <Card className="border-red-500/30">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                <p className="text-sm text-muted-foreground">Rejetés</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtres */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="pending_review">En révision</SelectItem>
                <SelectItem value="approved">Approuvés</SelectItem>
                <SelectItem value="rejected">Rejetés</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Liste des clients */}
          <div className="space-y-3">
            {filteredClients?.map((client) => (
              <Card key={client.user_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{client.display_name}</h4>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                        <div className="flex gap-2 mt-2">
                          {client.phone_verified && (
                            <Badge variant="outline" className="text-xs">
                              <Phone className="w-3 h-3 mr-1" />
                              Téléphone vérifié
                            </Badge>
                          )}
                          {client.identity_verified && (
                            <Badge variant="outline" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              Identité vérifiée
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {getStatusBadge(client.verification_status)}
                        {getLevelBadge(client.verification_level)}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {client.verification_status !== 'approved' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => openDialog(client, 'approve')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approuver
                        </Button>
                      )}
                      {client.verification_status !== 'rejected' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDialog(client, 'reject')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeter
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDialog(client, 'level')}
                      >
                        Niveau
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openDialog(client, 'force')}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        Forcer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredClients?.length === 0 && (
              <div className="text-center p-8 text-muted-foreground">
                Aucun client trouvé
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour les actions */}
      <Dialog open={!!actionType} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approuver le client'}
              {actionType === 'reject' && 'Rejeter la vérification'}
              {actionType === 'level' && 'Modifier le niveau de vérification'}
              {actionType === 'force' && '⚠️ Forcer l\'activation vendeur'}
            </DialogTitle>
            <DialogDescription>
              Client: {selectedClient?.display_name} ({selectedClient?.email})
              {actionType === 'force' && (
                <span className="block mt-2 text-orange-600 font-medium">
                  Cette action force l'activation complète du compte vendeur, même si les vérifications ne sont pas complètes. 
                  À utiliser uniquement pour débloquer des situations exceptionnelles.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === 'level' && (
              <div>
                <label className="text-sm font-medium">Nouveau niveau</label>
                <Select value={newLevel} onValueChange={setNewLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">
                {actionType === 'reject' ? 'Raison du rejet' : 
                 actionType === 'force' ? 'Raison du forçage (obligatoire)' : 
                 'Notes admin (optionnel)'}
              </label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  actionType === 'reject' 
                    ? 'Expliquez pourquoi la vérification est rejetée...'
                    : 'Ajoutez des notes internes...'
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Annuler</Button>
            <Button 
              onClick={handleAction}
              variant={actionType === 'force' ? 'destructive' : actionType === 'reject' ? 'destructive' : 'default'}
              disabled={
                approveMutation.isPending || 
                rejectMutation.isPending || 
                updateLevelMutation.isPending || 
                forceActivateMutation.isPending
              }
            >
              {actionType === 'force' ? '⚠️ Forcer maintenant' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
