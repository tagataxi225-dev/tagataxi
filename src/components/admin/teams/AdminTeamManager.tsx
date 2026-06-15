import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Building,
  TrendingUp,
  CreditCard,
  UserCheck,
  BarChart3,
  Download,
  Calendar,
  Clock,
  MessageSquare
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface TeamAccount {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  settings?: any;
  status?: string;
  created_at: string;
  updated_at: string;
}

interface TeamRequest {
  id: string;
  user_id: string;
  company_name: string;
  industry?: string;
  team_size?: string;
  contact_email: string;
  phone?: string;
  request_reason?: string;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

interface TeamStats {
  totalTeams: number;
  activeTeams: number;
  pendingTeams: number;
  totalMembers: number;
  totalRevenue: number;
  avgMembersPerTeam: number;
  pendingRequests: number;
}

export const AdminTeamManager = () => {
  const { toast } = useToast();
  const [teams, setTeams] = useState<TeamAccount[]>([]);
  const [teamRequests, setTeamRequests] = useState<TeamRequest[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<TeamAccount[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<TeamRequest[]>([]);
  const [stats, setStats] = useState<TeamStats>({
    totalTeams: 0,
    activeTeams: 0,
    pendingTeams: 0,
    totalMembers: 0,
    totalRevenue: 0,
    avgMembersPerTeam: 0,
    pendingRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<TeamAccount | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<TeamRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Charger les données des équipes et demandes
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Charger les équipes réelles
      const { data: teamsData, error: teamsError } = await supabase
        .from('team_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (teamsError) throw teamsError;

      // Charger les demandes en attente
      const { data: requestsData, error: requestsError } = await supabase
        .from('team_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      setTeams(teamsData || []);
      setTeamRequests(requestsData || []);
      setFilteredTeams(teamsData || []);
      setFilteredRequests(requestsData || []);

      // Calculer les statistiques
      const newStats: TeamStats = {
        totalTeams: (teamsData || []).length,
        activeTeams: (teamsData || []).length, // Tous actifs par défaut
        pendingTeams: 0,
        totalMembers: 0, // À calculer plus tard si nécessaire
        totalRevenue: 0, // À calculer plus tard si nécessaire 
        avgMembersPerTeam: 0,
        pendingRequests: (requestsData || []).filter(r => r.status === 'pending').length
      };
      setStats(newStats);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données des équipes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrer les équipes et demandes
  useEffect(() => {
    let filteredTeamsData = teams;
    let filteredRequestsData = teamRequests;

    if (searchQuery) {
      filteredTeamsData = filteredTeamsData.filter(team => 
        team.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      filteredRequestsData = filteredRequestsData.filter(request => 
        request.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.contact_email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filteredRequestsData = filteredRequestsData.filter(request => request.status === statusFilter);
    }

    setFilteredTeams(filteredTeamsData);
    setFilteredRequests(filteredRequestsData);
  }, [teams, teamRequests, searchQuery, statusFilter]);

  const handleStatusChange = async (teamId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('team_accounts')
        .update({ status: newStatus })
        .eq('id', teamId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `Le statut de l'équipe a été mis à jour avec succès.`,
      });

      // Rafraîchir les données
      await fetchData();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('team_requests')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Demande approuvée",
        description: "La demande a été approuvée. Un compte équipe sera créé automatiquement.",
      });

      // Rafraîchir les données
      await fetchData();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'approuver la demande.",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('team_requests')
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Demande rejetée",
        description: "La demande a été rejetée avec succès.",
      });

      // Rafraîchir les données
      await fetchData();
      setRejectionReason('');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de rejeter la demande.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Actif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">En attente</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Suspendu</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactif</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', { 
      style: 'currency', 
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Équipes</h1>
          <p className="text-muted-foreground">
            Gérez et supervisez tous les comptes équipe de la plateforme
          </p>
        </div>
        <Button className="gap-2">
          <Download className="w-4 h-4" />
          Exporter
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Équipes</p>
                <p className="text-2xl font-bold">{stats.totalTeams}</p>
              </div>
              <Building className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Équipes Actives</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeTeams}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Demandes en Attente</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingRequests}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Membres</p>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenus Total</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Onglets pour équipes et demandes */}
      <Tabs defaultValue="teams" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="teams">Équipes ({filteredTeams.length})</TabsTrigger>
          <TabsTrigger value="requests">Demandes ({filteredRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Équipes Actives
              </CardTitle>
            </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Équipe</TableHead>
                <TableHead>Industrie</TableHead>
                <TableHead>Membres</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dépenses</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{team.name}</div>
                      <div className="text-sm text-muted-foreground">{team.description || 'Aucune description'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Non spécifié</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      0
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(team.status || 'active')}</TableCell>
                  <TableCell>
                    <div className="font-medium">{formatCurrency(0)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(team.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedTeam(team);
                          setShowDetails(true);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(team.id, 'suspended')}>
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Suspendre
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredTeams.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune équipe trouvée</p>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
      
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Demandes d'Équipe
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Industrie</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.company_name}</div>
                          <div className="text-sm text-muted-foreground">{request.contact_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.industry || 'Non spécifié'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{request.team_size || 'Non spécifié'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {request.phone && <div>📞 {request.phone}</div>}
                          <div>✉️ {request.contact_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(request.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRequestDetails(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {request.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApproveRequest(request.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Rejeter la demande</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <Textarea
                                      placeholder="Motif du rejet..."
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <Button variant="outline">Annuler</Button>
                                      <Button 
                                        variant="destructive"
                                        onClick={() => handleRejectRequest(request.id, rejectionReason)}
                                      >
                                        Rejeter
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredRequests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune demande trouvée</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de détails */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Détails de l'équipe
            </DialogTitle>
          </DialogHeader>
          
          {selectedTeam && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                <TabsTrigger value="members">Membres</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold">Informations générales</h4>
                        <p><strong>Nom:</strong> {selectedTeam.name}</p>
                        <p><strong>Description:</strong> {selectedTeam.description || 'Non spécifiée'}</p>
                        <p><strong>Statut:</strong> {getStatusBadge('active')}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold">Statistiques</h4>
                        <p><strong>Membres:</strong> 0</p>
                        <p><strong>Total dépensé:</strong> {formatCurrency(0)}</p>
                        <p><strong>Créé le:</strong> {new Date(selectedTeam.created_at).toLocaleDateString('fr-FR')}</p>
                        <p><strong>Mis à jour:</strong> {new Date(selectedTeam.updated_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="members" className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Gestion des membres en cours de développement</p>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Analytics détaillées en cours de développement</p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de détails des demandes */}
      <Dialog open={showRequestDetails} onOpenChange={setShowRequestDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Détails de la demande
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Informations générales</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Entreprise:</strong> {selectedRequest.company_name}</p>
                    <p><strong>Email:</strong> {selectedRequest.contact_email}</p>
                    <p><strong>Téléphone:</strong> {selectedRequest.phone || 'Non renseigné'}</p>
                    <p><strong>Industrie:</strong> {selectedRequest.industry || 'Non spécifiée'}</p>
                    <p><strong>Taille équipe:</strong> {selectedRequest.team_size || 'Non spécifiée'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Statut et dates</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Statut:</strong> {getStatusBadge(selectedRequest.status)}</p>
                    <p><strong>Demande créée:</strong> {new Date(selectedRequest.created_at).toLocaleDateString('fr-FR')}</p>
                    {selectedRequest.reviewed_at && (
                      <p><strong>Révisée le:</strong> {new Date(selectedRequest.reviewed_at).toLocaleDateString('fr-FR')}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedRequest.request_reason && (
                <div>
                  <h4 className="font-semibold mb-2">Motif de la demande</h4>
                  <p className="text-sm bg-muted p-3 rounded">{selectedRequest.request_reason}</p>
                </div>
              )}

              {selectedRequest.rejection_reason && (
                <div>
                  <h4 className="font-semibold mb-2">Motif du rejet</h4>
                  <p className="text-sm bg-red-50 text-red-800 p-3 rounded">{selectedRequest.rejection_reason}</p>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleApproveRequest(selectedRequest.id)}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approuver
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="flex-1">
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeter
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Rejeter la demande</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Motif du rejet..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline">Annuler</Button>
                          <Button 
                            variant="destructive"
                            onClick={() => handleRejectRequest(selectedRequest.id, rejectionReason)}
                          >
                            Rejeter
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};