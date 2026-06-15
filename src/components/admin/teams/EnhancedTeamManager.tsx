/**
 * Module d'administration des équipes optimisé
 * Utilise les nouvelles tables : team_accounts, team_requests, business_team_members
 * Avec système d'invitations et workflow complet
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Building2,
  UserPlus,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Crown,
  User,
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TeamAccount {
  id: string;
  company_name: string;
  owner_id: string;
  status: string;
  industry?: string;
  employee_count?: number;
  monthly_budget?: number;
  created_at: string;
  verified_at?: string;
}

interface TeamMember {
  id: string;
  business_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  permissions?: any;
  business?: {
    company_name: string;
  };
}

interface TeamRequest {
  id: string;
  user_id: string;
  company_name: string;
  contact_email: string;
  phone: string;
  industry: string;
  employee_count: number;
  status: string;
  created_at: string;
  reviewed_at?: string;
}

interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: string;
  status: string;
  invited_by: string;
  created_at: string;
  expires_at: string;
}

interface EnhancedTeamManagerProps {
  onBack: () => void;
}

export const EnhancedTeamManager: React.FC<EnhancedTeamManagerProps> = ({ onBack }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('teams');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState<TeamAccount | null>(null);

  // Statistiques des équipes
  const { data: teamStats } = useQuery({
    queryKey: ['team-stats'],
    queryFn: async () => {
      const { data: teams } = await supabase
        .from('business_accounts')
        .select('status, monthly_budget, employee_count');
      
      const { data: members } = await supabase
        .from('business_team_members')
        .select('business_id');

      const { data: requests } = await supabase
        .from('team_requests')
        .select('status');

      return {
        totalTeams: teams?.length || 0,
        activeTeams: teams?.filter(t => t.status === 'active').length || 0,
        totalMembers: members?.length || 0,
        pendingRequests: requests?.filter(r => r.status === 'pending').length || 0,
        totalBudget: teams?.reduce((sum, t) => sum + (t.monthly_budget || 0), 0) || 0
      };
    }
  });

  // Équipes business
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['business-teams', searchQuery, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('business_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchQuery) {
        query = query.ilike('company_name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TeamAccount[];
    }
  });

  // Membres des équipes
  const { data: teamMembers } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_team_members')
        .select(`
          *,
          business_accounts!inner(company_name)
        `)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      return data.map(member => ({
        ...member,
        business: { company_name: member.business_accounts?.company_name || 'Équipe inconnue' }
      })) as TeamMember[];
    }
  });

  // Demandes d'équipes
  const { data: teamRequests } = useQuery({
    queryKey: ['team-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map(item => ({
        ...item,
        employee_count: typeof item.team_size === 'number' ? item.team_size : 0
      })) as TeamRequest[];
    }
  });

  // Mutation pour approuver/rejeter une demande
  const approveTeamRequest = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string, action: 'approve' | 'reject' }) => {
      if (action === 'approve') {
        // 1. Créer l'équipe business
        const request = teamRequests?.find(r => r.id === requestId);
        if (!request) throw new Error('Request not found');

        const { data: team, error: teamError } = await supabase
          .from('business_accounts')
          .insert({
            company_name: request.company_name,
            owner_id: request.user_id,
            industry: request.industry,
            employee_count: request.employee_count,
            status: 'active'
          })
          .select()
          .single();

        if (teamError) throw teamError;

        // 2. Ajouter le créateur comme admin
        const { error: memberError } = await supabase
          .from('business_team_members')
          .insert({
            business_id: team.id,
            user_id: request.user_id,
            role: 'admin',
            status: 'active'
          });

        if (memberError) throw memberError;
      }

      // 3. Mettre à jour la demande
      const { error } = await supabase
        .from('team_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['team-requests'] });
      queryClient.invalidateQueries({ queryKey: ['business-teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: action === 'approve' ? 'Équipe créée' : 'Demande rejetée',
        description: action === 'approve' 
          ? 'L\'équipe a été créée avec succès' 
          : 'La demande a été rejetée'
      });
    }
  });

  // Mutation pour changer le statut d'une équipe
  const updateTeamStatus = useMutation({
    mutationFn: async ({ teamId, status }: { teamId: string, status: string }) => {
      const { error } = await supabase
        .from('business_accounts')
        .update({ status })
        .eq('id', teamId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-teams'] });
      toast({
        title: 'Statut mis à jour',
        description: 'Le statut de l\'équipe a été modifié'
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'suspended': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'suspended': return 'Suspendu';
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Crown;
      case 'member': return User;
      default: return User;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Gestion des Équipes</h1>
              <p className="text-sm text-muted-foreground">Administration complète des équipes business</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Inviter équipe
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="teams">Équipes ({teamStats?.totalTeams || 0})</TabsTrigger>
            <TabsTrigger value="members">Membres ({teamStats?.totalMembers || 0})</TabsTrigger>
            <TabsTrigger value="requests">Demandes ({teamStats?.pendingRequests || 0})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="space-y-4">
            {/* Statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Équipes</p>
                      <p className="text-2xl font-bold">{teamStats?.totalTeams || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Actives</p>
                      <p className="text-2xl font-bold">{teamStats?.activeTeams || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Membres</p>
                      <p className="text-2xl font-bold">{teamStats?.totalMembers || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Budget Total</p>
                      <p className="text-2xl font-bold">{(teamStats?.totalBudget || 0).toLocaleString()} FC</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtres */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher des équipes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="suspended">Suspendu</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Liste des équipes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams?.map((team) => (
                <Card key={team.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{team.company_name}</CardTitle>
                      <Badge variant={getStatusColor(team.status)}>
                        {getStatusLabel(team.status)}
                      </Badge>
                    </div>
                    {team.industry && (
                      <p className="text-sm text-muted-foreground">{team.industry}</p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {team.employee_count && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{team.employee_count} employés</span>
                        </div>
                      )}
                      {team.monthly_budget && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>{team.monthly_budget.toLocaleString()} FC</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Créé le {new Date(team.created_at).toLocaleDateString('fr-FR')}
                      {team.verified_at && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>Vérifié</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedTeam(team)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Détails
                      </Button>
                      
                      {team.status === 'active' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateTeamStatus.mutate({ teamId: team.id, status: 'suspended' })}
                        >
                          Suspendre
                        </Button>
                      )}
                      
                      {team.status === 'suspended' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateTeamStatus.mutate({ teamId: team.id, status: 'active' })}
                        >
                          Activer
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {teams?.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune équipe trouvée</h3>
                  <p className="text-muted-foreground">
                    Les équipes business apparaîtront ici une fois créées.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            {/* Grouper les membres par équipe */}
            {teamMembers && Object.entries(
              teamMembers.reduce((acc, member) => {
                const teamName = member.business?.company_name || 'Équipe inconnue';
                if (!acc[teamName]) acc[teamName] = [];
                acc[teamName].push(member);
                return acc;
              }, {} as Record<string, TeamMember[]>)
            ).map(([teamName, members]) => (
              <Card key={teamName}>
                <CardHeader>
                  <CardTitle className="text-lg">{teamName}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {members.length} membre{members.length > 1 ? 's' : ''}
                  </p>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {members.map((member) => {
                      const RoleIcon = getRoleIcon(member.role);
                      
                      return (
                        <div 
                          key={member.id} 
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {member.user_id.slice(-2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div>
                              <p className="font-medium text-sm">
                                Utilisateur {member.user_id.slice(-6)}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <RoleIcon className="h-3 w-3" />
                                <span>{member.role === 'admin' ? 'Administrateur' : 'Membre'}</span>
                                <span>•</span>
                                <span>Rejoint le {new Date(member.joined_at).toLocaleDateString('fr-FR')}</span>
                              </div>
                            </div>
                          </div>
                          
                          <Badge variant={getStatusColor(member.status)}>
                            {getStatusLabel(member.status)}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}

            {!teamMembers?.length && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun membre trouvé</h3>
                  <p className="text-muted-foreground">
                    Les membres des équipes apparaîtront ici.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {teamRequests?.map((request) => (
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
                        <span>{request.employee_count} employés</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{request.contact_email}</span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Demandé le {new Date(request.created_at).toLocaleDateString('fr-FR')}
                    </div>
                    
                    {request.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => approveTeamRequest.mutate({ requestId: request.id, action: 'approve' })}
                          disabled={approveTeamRequest.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approuver
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => approveTeamRequest.mutate({ requestId: request.id, action: 'reject' })}
                          disabled={approveTeamRequest.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeter
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {!teamRequests?.length && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune demande</h3>
                  <p className="text-muted-foreground">
                    Les demandes d'équipes apparaîtront ici.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytiques des Équipes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Module d'analytics avancées en cours de développement...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};