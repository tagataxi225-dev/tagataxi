import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserPlus, Users, Shield, Trash2, Mail, Phone, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePartnerTeamManagement, TeamRole } from '@/hooks/usePartnerTeamManagement';

const roleLabels: Record<string, { label: string; color: string; description: string }> = {
  admin: { label: 'Administrateur', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', description: 'Accès complet' },
  manager: { label: 'Gestionnaire', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', description: 'Chauffeurs & véhicules' },
  accountant: { label: 'Comptable', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', description: 'Finances uniquement' },
  viewer: { label: 'Observateur', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', description: 'Lecture seule' },
};

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  active: { label: 'Actif', variant: 'default' },
  pending: { label: 'En attente', variant: 'secondary' },
  inactive: { label: 'Inactif', variant: 'destructive' },
};

interface PartnerTeamManagerProps {
  partnerId?: string;
}

export const PartnerTeamManager = ({ partnerId }: PartnerTeamManagerProps) => {
  const {
    members,
    loading,
    actionLoading,
    inviteMember,
    updateMemberRole,
    removeMember,
    refresh,
  } = usePartnerTeamManagement(partnerId);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMember, setNewMember] = useState({ email: '', role: 'viewer' as TeamRole });

  const handleInvite = async () => {
    if (!newMember.email) {
      toast.error('Veuillez saisir un email');
      return;
    }
    const success = await inviteMember(newMember.email, newMember.role);
    if (success) {
      setNewMember({ email: '', role: 'viewer' });
      setShowAddDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Gestion d'Équipe</h2>
          <p className="text-sm text-muted-foreground">
            Invitez des collaborateurs à gérer votre flotte
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Inviter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Inviter un membre</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email de l'utilisateur *</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="jean@example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    L'utilisateur doit déjà avoir un compte Tembea
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Rôle</Label>
                  <Select
                    value={newMember.role}
                    onValueChange={(v) => setNewMember(prev => ({ ...prev, role: v as TeamRole }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([key, val]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col">
                            <span>{val.label}</span>
                            <span className="text-xs text-muted-foreground">{val.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Annuler</Button>
                <Button onClick={handleInvite} disabled={actionLoading}>
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Envoyer l'invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Rôles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Rôles et Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(roleLabels).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Badge className={cn("shrink-0", val.color)}>{val.label}</Badge>
                <span className="text-sm text-muted-foreground">{val.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Membres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Membres de l'équipe</CardTitle>
          <CardDescription>
            {loading ? 'Chargement...' : `${members.length} membre${members.length > 1 ? 's' : ''} dans votre équipe`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun membre dans votre équipe</p>
              <p className="text-sm">Invitez des collaborateurs pour déléguer la gestion</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const rl = roleLabels[member.role] || roleLabels.viewer;
                const sl = statusLabels[member.status] || statusLabels.pending;
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card gap-3"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {member.display_name || 'Utilisateur'}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                          {member.phone_number && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {member.phone_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Role selector */}
                      <Select
                        value={member.role}
                        onValueChange={(v) => updateMemberRole(member.id, v as TeamRole)}
                      >
                        <SelectTrigger className="w-auto h-8 text-xs">
                          <Badge className={cn("text-xs", rl.color)}>{rl.label}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(roleLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Badge variant={sl.variant} className="text-xs">{sl.label}</Badge>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" disabled={actionLoading}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Retirer ce membre ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {member.display_name || 'Ce membre'} n'aura plus accès à votre espace partenaire.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeMember(member.id)}>
                              Retirer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
