import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Building2, 
  Users, 
  Mail,
  Check,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TeamRequest {
  id: string;
  user_id: string;
  company_name: string;
  contact_email: string;
  phone: string;
  industry: string;
  team_size: number;
  request_reason?: string;
  status: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
}

export const TeamRequests: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending team requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['team-requests'],
    queryFn: async (): Promise<TeamRequest[]> => {
      const { data, error } = await supabase
        .from('team_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match interface
      return (data || []).map(item => ({
        ...item,
        team_size: typeof item.team_size === 'string' ? parseInt(item.team_size) : item.team_size
      }));
    }
  });

  // Review team request mutation
  const reviewRequest = useMutation({
    mutationFn: async ({ 
      requestId, 
      action, 
      rejectionReason 
    }: { 
      requestId: string; 
      action: 'approve' | 'reject';
      rejectionReason?: string;
    }) => {
      const { error } = await supabase
        .from('team_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          rejection_reason: rejectionReason
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['team-requests'] });
      toast({
        title: action === 'approve' ? "Demande approuvée" : "Demande rejetée",
        description: action === 'approve' 
          ? "L'équipe a été créée avec succès" 
          : "La demande a été rejetée",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de traiter la demande",
        variant: "destructive",
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  const handleApprove = (requestId: string) => {
    reviewRequest.mutate({ requestId, action: 'approve' });
  };

  const handleReject = (requestId: string) => {
    const rejectionReason = prompt("Raison du rejet (optionnel):");
    reviewRequest.mutate({ 
      requestId, 
      action: 'reject',
      rejectionReason: rejectionReason || undefined
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Demandes d'équipes ({requests?.length || 0})
          </CardTitle>
        </CardHeader>
      </Card>

      {requests && requests.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{request.company_name}</CardTitle>
                  <Badge variant={getStatusColor(request.status)}>
                    {getStatusLabel(request.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{request.industry}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{request.team_size} membres</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{request.contact_email}</span>
                </div>
                
                {request.request_reason && (
                  <p className="text-sm text-muted-foreground border-l-2 border-muted pl-3">
                    {request.request_reason}
                  </p>
                )}
                
                <div className="text-xs text-muted-foreground">
                  Demandé le {new Date(request.created_at).toLocaleDateString('fr-FR')}
                </div>
                
                {request.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleApprove(request.id)}
                      disabled={reviewRequest.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approuver
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleReject(request.id)}
                      disabled={reviewRequest.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rejeter
                    </Button>
                  </div>
                )}
                
                {request.rejection_reason && (
                  <p className="text-sm text-destructive border-l-2 border-destructive pl-3">
                    Raison du rejet: {request.rejection_reason}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune demande en attente</h3>
            <p className="text-muted-foreground">
              Les nouvelles demandes d'équipes apparaîtront ici.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};