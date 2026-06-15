import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, Eye, Search, Filter } from 'lucide-react';
import { VerificationDetailDialog } from './VerificationDetailDialog';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface VerificationWithUser {
  id: string;
  user_id: string;
  phone_verified: boolean;
  identity_verified: boolean;
  verification_level: string;
  verification_status: string;
  identity_document_url: string | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  clients?: {
    display_name?: string;
    email?: string;
    phone_number?: string;
  } | null;
}

export const AdminUserVerificationManager = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVerification, setSelectedVerification] = useState<VerificationWithUser | null>(null);

  const { data: verifications, isLoading, refetch } = useQuery({
    queryKey: ['adminVerifications', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('user_verification')
        .select(`
          *,
          clients!user_verification_user_id_fkey (
            display_name,
            email,
            phone_number
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('verification_status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as VerificationWithUser[];
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['verificationStats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_verification')
        .select('verification_status');
      
      if (error) throw error;

      const total = data.length;
      const pending = data.filter(v => v.verification_status === 'pending_review').length;
      const approved = data.filter(v => v.verification_status === 'approved').length;
      const rejected = data.filter(v => v.verification_status === 'rejected').length;

      return { total, pending, approved, rejected };
    }
  });

  const filteredVerifications = verifications?.filter(v => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      v.clients?.display_name?.toLowerCase().includes(search) ||
      v.clients?.email?.toLowerCase().includes(search) ||
      v.clients?.phone_number?.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Chargement des vérifications...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <div className="text-sm text-muted-foreground">Total demandes</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-700">{stats?.pending || 0}</div>
            <div className="text-sm text-yellow-600">En attente de validation</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-700">{stats?.approved || 0}</div>
            <div className="text-sm text-green-600">Approuvés ce mois</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-700">{stats?.rejected || 0}</div>
            <div className="text-sm text-red-600">Rejetés</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Vérifications des comptes utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending_review">En attente</SelectItem>
                <SelectItem value="approved">Approuvés</SelectItem>
                <SelectItem value="rejected">Rejetés</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Verifications List */}
          <div className="space-y-3">
            {filteredVerifications?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Aucune vérification trouvée
              </div>
            ) : (
              filteredVerifications?.map((verification) => (
                <Card key={verification.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                          {verification.clients?.display_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-lg">
                            {verification.clients?.display_name || 'Utilisateur inconnu'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {verification.clients?.email} • {verification.clients?.phone_number}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(verification.verification_status)}
                            {verification.identity_document_url && (
                              <Badge variant="outline" className="text-xs">
                                Document fourni
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-sm text-muted-foreground">
                          Soumis {formatDistanceToNow(new Date(verification.created_at), { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </div>
                        <Button
                          onClick={() => setSelectedVerification(verification)}
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Examiner
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {selectedVerification && (
        <VerificationDetailDialog
          verification={selectedVerification}
          open={!!selectedVerification}
          onClose={() => setSelectedVerification(null)}
          onSuccess={() => {
            refetch();
            setSelectedVerification(null);
          }}
        />
      )}
    </div>
  );
};
