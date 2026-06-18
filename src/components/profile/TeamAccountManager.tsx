import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, Crown, Settings, BarChart3, CreditCard, UserCheck, Mail, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTeamRequests } from '@/hooks/useTeamRequests';
import { useTeamAccount } from '@/hooks/useTeamAccount';

export const TeamAccountManager = () => {
  const { toast } = useToast();
  const { requests, loading: requestsLoading, submitRequest } = useTeamRequests();
  const { teamAccount, teamMembers, loading: teamLoading, inviteMember } = useTeamAccount();
  
  const [isRequestingTeam, setIsRequestingTeam] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [teamForm, setTeamForm] = useState({
    company_name: '',
    industry: '',
    team_size: '',
    contact_email: '',
    phone: '',
    request_reason: '',
  });
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member',
  });

  const teamFeatures = [
    {
      icon: Users,
      title: 'Gestion centralisée',
      description: 'Gérez tous les comptes employés depuis un tableau de bord unique'
    },
    {
      icon: BarChart3,
      title: 'Rapports détaillés',
      description: 'Suivez les dépenses et l\'utilisation par département ou employé'
    },
    {
      icon: CreditCard,
      title: 'Facturation simplifiée',
      description: 'Une seule facture pour toutes les courses de votre équipe'
    },
    {
      icon: Settings,
      title: 'Politiques personnalisées',
      description: 'Définissez des règles d\'utilisation et des budgets par utilisateur'
    }
  ];

  const mockTeamMembers = [
    {
      id: '1',
      name: 'Jean Mukendi',
      email: 'jean@entreprise.cd',
      role: 'admin',
      status: 'active',
      last_ride: '2024-01-15',
      total_rides: 24
    },
    {
      id: '2',
      name: 'Marie Kabanga',
      email: 'marie@entreprise.cd',
      role: 'member',
      status: 'active',
      last_ride: '2024-01-14',
      total_rides: 18
    },
    {
      id: '3',
      name: 'Paul Mbuyi',
      email: 'paul@entreprise.cd',
      role: 'member',
      status: 'pending',
      last_ride: null,
      total_rides: 0
    }
  ];

  const handleRequestTeam = async () => {
    if (!teamForm.company_name || !teamForm.contact_email) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    try {
      await submitRequest({
        company_name: teamForm.company_name,
        industry: teamForm.industry,
        team_size: teamForm.team_size,
        contact_email: teamForm.contact_email,
        phone: teamForm.phone,
        request_reason: teamForm.request_reason,
      });

      toast({
        title: "Demande soumise",
        description: "Votre demande de compte équipe a été soumise. Vous recevrez une notification dès qu'elle sera traitée.",
      });

      setIsRequestingTeam(false);
      setTeamForm({
        company_name: '',
        industry: '',
        team_size: '',
        contact_email: '',
        phone: '',
        request_reason: '',
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de soumettre votre demande. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleInviteMember = async () => {
    if (!inviteForm.email) {
      toast({
        title: "Email requis",
        description: "Veuillez saisir l'email de la personne à inviter.",
        variant: "destructive",
      });
      return;
    }

    try {
      await inviteMember(inviteForm.email, inviteForm.role);
      
      toast({
        title: "Invitation envoyée",
        description: `Une invitation a été envoyée à ${inviteForm.email}.`,
      });

      setIsInviting(false);
      setInviteForm({ email: '', role: 'member' });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'invitation. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />;
      case 'manager': return <Settings className="w-4 h-4" />;
      default: return <UserCheck className="w-4 h-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">Admin</Badge>;
      case 'manager':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Manager</Badge>;
      default:
        return <Badge variant="secondary">Membre</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Actif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">En attente</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Approuvée</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Rejetée</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactif</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const getRequestStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  // Vérifier s'il y a une demande en attente
  const hasPendingRequest = requests.some(req => req.status === 'pending');
  const hasApprovedRequest = requests.some(req => req.status === 'approved');

  if (requestsLoading || teamLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Compte équipe TAGA</h2>
        <p className="text-muted-foreground">Gérez les déplacements de votre entreprise en toute simplicité</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="team">Équipe</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Avantages du compte équipe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {teamFeatures.map((feature) => {
                  const IconComponent = feature.icon;
                  return (
                    <div key={feature.title} className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg shrink-0">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {teamMembers ? teamMembers.length : 0}
                </div>
                <p className="text-sm text-muted-foreground">Membres actifs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">0</div>
                <p className="text-sm text-muted-foreground">Courses ce mois</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  0 CDF
                </div>
                <p className="text-sm text-muted-foreground">Budget utilisé</p>
              </CardContent>
            </Card>
          </div>

          {/* Statut de l'équipe ou demandes */}
          {teamAccount ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800">Compte équipe actif</h3>
                    <p className="text-sm text-muted-foreground">
                      Votre équipe "{teamAccount.name}" est opérationnelle
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="text-muted-foreground">{teamAccount.description || 'Aucune description'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Plan d'abonnement:</span>
                    <p className="text-muted-foreground capitalize">Standard</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : requests.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Vos demandes de compte équipe
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getRequestStatusIcon(request.status)}
                        <h4 className="font-medium">{request.company_name}</h4>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Email:</span>
                        <p className="text-muted-foreground">{request.contact_email}</p>
                      </div>
                      <div>
                        <span className="font-medium">Secteur:</span>
                        <p className="text-muted-foreground">{request.industry || 'Non spécifié'}</p>
                      </div>
                    </div>
                    {request.status === 'rejected' && request.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>Raison du rejet:</strong> {request.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {/* Create Team CTA */}
          {!teamAccount && !hasPendingRequest && !hasApprovedRequest && (
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold mb-2">Demander un compte équipe</h3>
                <p className="text-muted-foreground mb-4">
                  Soumettez une demande pour créer un compte équipe. Notre équipe l'examinera et vous contactera.
                </p>
                <Dialog open={isRequestingTeam} onOpenChange={setIsRequestingTeam}>
                  <DialogTrigger asChild>
                    <Button size="lg">
                      <Plus className="w-4 h-4 mr-2" />
                      Demander un compte équipe
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-full max-w-md mx-4">
                    <DialogHeader>
                      <DialogTitle>Demande de compte équipe</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="company_name">Nom de l'entreprise *</Label>
                        <Input
                          id="company_name"
                          value={teamForm.company_name}
                          onChange={(e) => setTeamForm(prev => ({ ...prev, company_name: e.target.value }))}
                          placeholder="Ex: Mon Entreprise SARL"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="industry">Secteur d'activité</Label>
                          <Select
                            value={teamForm.industry}
                            onValueChange={(value) => setTeamForm(prev => ({ ...prev, industry: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="technology">Technologie</SelectItem>
                              <SelectItem value="finance">Finance</SelectItem>
                              <SelectItem value="healthcare">Santé</SelectItem>
                              <SelectItem value="education">Éducation</SelectItem>
                              <SelectItem value="retail">Commerce</SelectItem>
                              <SelectItem value="other">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="team_size">Taille de l'équipe</Label>
                          <Select
                            value={teamForm.team_size}
                            onValueChange={(value) => setTeamForm(prev => ({ ...prev, team_size: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1-10">1-10 employés</SelectItem>
                              <SelectItem value="11-50">11-50 employés</SelectItem>
                              <SelectItem value="51-200">51-200 employés</SelectItem>
                              <SelectItem value="200+">200+ employés</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="contact_email">Email de contact *</Label>
                        <Input
                          id="contact_email"
                          type="email"
                          value={teamForm.contact_email}
                          onChange={(e) => setTeamForm(prev => ({ ...prev, contact_email: e.target.value }))}
                          placeholder="contact@entreprise.cd"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input
                          id="phone"
                          value={teamForm.phone}
                          onChange={(e) => setTeamForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+243 123 456 789"
                        />
                      </div>

                      <div>
                        <Label htmlFor="request_reason">Raison de la demande (optionnel)</Label>
                        <Textarea
                          id="request_reason"
                          value={teamForm.request_reason}
                          onChange={(e) => setTeamForm(prev => ({ ...prev, request_reason: e.target.value }))}
                          placeholder="Expliquez pourquoi vous avez besoin d'un compte équipe..."
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleRequestTeam} className="flex-1">
                          Soumettre la demande
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsRequestingTeam(false)}
                          className="flex-1"
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Membres de l'équipe</h3>
              <p className="text-muted-foreground">
                {teamAccount ? `${teamMembers.length} membre(s) dans votre équipe` : 'Aucune équipe active'}
              </p>
            </div>
            {teamAccount && (
              <Dialog open={isInviting} onOpenChange={setIsInviting}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Mail className="w-4 h-4 mr-2" />
                    Inviter un membre
                  </Button>
                </DialogTrigger>
              <DialogContent className="w-full max-w-md mx-4">
                <DialogHeader>
                  <DialogTitle>Inviter un membre</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="utilisateur@entreprise.cd"
                    />
                  </div>

                  <div>
                    <Label htmlFor="role">Rôle</Label>
                    <Select
                      value={inviteForm.role}
                      onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Membre</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleInviteMember} className="flex-1">
                      Envoyer l'invitation
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsInviting(false)}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </DialogContent>
              </Dialog>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              {!teamAccount ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-semibold mb-2">Aucune équipe active</h4>
                  <p className="text-muted-foreground mb-4">
                    Vous devez d'abord avoir un compte équipe approuvé pour voir les membres.
                  </p>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-semibold mb-2">Aucun membre dans l'équipe</h4>
                  <p className="text-muted-foreground mb-4">
                    Commencez par inviter des membres à rejoindre votre équipe.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="bg-primary/10 p-2 rounded-full">
                            {getRoleIcon(member.role)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">
                                {member.profiles?.display_name || `Utilisateur ${member.user_id.slice(0, 8)}`}
                              </h4>
                              {getRoleBadge(member.role)}
                              {getStatusBadge(member.status)}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {member.profiles?.phone_number || 'Téléphone non renseigné'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.joined_at ? `Rejoint le ${new Date(member.joined_at).toLocaleDateString('fr-FR')}` : 'Date d\'adhésion inconnue'}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres du compte équipe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-semibold mb-2">Paramètres non disponibles</h4>
                <p className="text-muted-foreground">
                  Cette section sera disponible après la création de votre compte équipe.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};