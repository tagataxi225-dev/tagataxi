import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserPlus, Users, Shield, Trash2, Phone, Mail, Loader2, RefreshCw, Check, X, Crown, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useVendorTeamManagement, VendorTeamRole, VENDOR_TEAM_ROLE_PERMISSIONS } from '@/hooks/useVendorTeamManagement';
import { useAuth } from '@/hooks/useAuth';

const roleConfig: Record<VendorTeamRole, { label: string; color: string; icon: React.ElementType }> = {
  admin: { label: 'Administrateur', color: 'bg-destructive/10 text-destructive', icon: Shield },
  manager: { label: 'Gestionnaire', color: 'bg-primary/10 text-primary', icon: Users },
  accountant: { label: 'Comptable', color: 'bg-emerald-500/10 text-emerald-600', icon: Eye },
  viewer: { label: 'Observateur', color: 'bg-muted text-muted-foreground', icon: Eye },
};

const permissionLabels = [
  { key: 'products', label: 'Produits' },
  { key: 'orders', label: 'Commandes' },
  { key: 'finances', label: 'Finances' },
  { key: 'settings', label: 'Paramètres' },
] as const;

const PermissionIcon = ({ value }: { value: boolean | 'read' }) => {
  if (value === true) return <Check className="h-4 w-4 text-primary" />;
  if (value === 'read') return <Eye className="h-3.5 w-3.5 text-accent-foreground" />;
  return <X className="h-4 w-4 text-muted-foreground/40" />;
};

export const VendorTeamManager = () => {
  const { user } = useAuth();
  const {
    teamAccount,
    members,
    loading,
    actionLoading,
    inviteMember,
    updateMemberRole,
    removeMember,
    refresh,
  } = useVendorTeamManagement();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<VendorTeamRole>('viewer');

  const isOwner = teamAccount?.owner_id === user?.id;

  const handleInvite = async () => {
    if (!searchInput.trim()) {
      toast.error('Veuillez saisir un email ou numéro de téléphone');
      return;
    }
    const success = await inviteMember(searchInput.trim(), selectedRole);
    if (success) {
      setSearchInput('');
      setSelectedRole('viewer');
      setShowAddDialog(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Équipe Boutique
            {members.length > 0 && (
              <Badge variant="secondary" className="text-xs ml-1">{members.length}</Badge>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Gérez les collaborateurs de votre boutique
          </p>
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          <Button variant="outline" size="icon" onClick={refresh} disabled={loading} className="h-8 w-8 sm:h-9 sm:w-9">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          {isOwner && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 h-8 sm:h-9 text-xs sm:text-sm">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Inviter</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un collaborateur</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Email ou téléphone *</Label>
                    <Input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="0991234567 ou email@example.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      L'utilisateur doit avoir un compte Tembea. Il sera ajouté directement à l'équipe.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Rôle</Label>
                    <Select
                      value={selectedRole}
                      onValueChange={(v) => setSelectedRole(v as VendorTeamRole)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(roleConfig) as VendorTeamRole[]).map((key) => {
                          const perms = VENDOR_TEAM_ROLE_PERMISSIONS[key];
                          return (
                            <SelectItem key={key} value={key}>
                              <span>{perms.label}</span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>Annuler</Button>
                  <Button onClick={handleInvite} disabled={actionLoading}>
                    {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Ajouter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Permissions par rôle
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Rôle</th>
                  {permissionLabels.map(p => (
                    <th key={p.key} className="text-center px-3 py-2 font-medium text-muted-foreground">{p.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(Object.keys(VENDOR_TEAM_ROLE_PERMISSIONS) as VendorTeamRole[]).map((role) => {
                  const perms = VENDOR_TEAM_ROLE_PERMISSIONS[role];
                  const rc = roleConfig[role];
                  return (
                    <tr key={role} className="border-b border-border/30 last:border-0">
                      <td className="px-4 py-2.5">
                        <Badge className={cn("text-xs", rc.color)}>{rc.label}</Badge>
                      </td>
                      {permissionLabels.map(p => (
                        <td key={p.key} className="text-center px-3 py-2.5">
                          <div className="flex justify-center">
                            <PermissionIcon value={perms[p.key]} />
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-border/30">
            {(Object.keys(VENDOR_TEAM_ROLE_PERMISSIONS) as VendorTeamRole[]).map((role) => {
              const perms = VENDOR_TEAM_ROLE_PERMISSIONS[role];
              const rc = roleConfig[role];
              return (
                <div key={role} className="px-3 py-2.5">
                  <Badge className={cn("text-xs mb-1.5", rc.color)}>{rc.label}</Badge>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {permissionLabels.map(p => (
                      <div key={p.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <PermissionIcon value={perms[p.key]} />
                        <span>{p.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="px-3 sm:px-4 py-2 border-t border-border/30 flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> Accès complet</span>
            <span className="flex items-center gap-1"><Eye className="h-3 w-3 text-accent-foreground" /> Lecture seule</span>
            <span className="flex items-center gap-1"><X className="h-3 w-3 text-muted-foreground/40" /> Pas d'accès</span>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            {loading ? 'Chargement...' : `${members.length} membre${members.length !== 1 ? 's' : ''}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <p className="font-medium">Votre équipe est vide</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                Ajoutez des collaborateurs pour déléguer la gestion de votre boutique
              </p>
              {isOwner && (
                <Button className="mt-4 gap-2" onClick={() => setShowAddDialog(true)}>
                  <UserPlus className="h-4 w-4" />
                  Ajouter un membre
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Owner row */}
              {teamAccount && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
                      <Crown className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Vous (Propriétaire)</p>
                      <p className="text-xs text-muted-foreground">Accès complet</p>
                    </div>
                  </div>
                  <Badge className="bg-primary/10 text-primary text-xs">Propriétaire</Badge>
                </div>
              )}

              {members.map((member, index) => {
                const rc = roleConfig[member.role] || roleConfig.viewer;
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-card gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.display_name || 'Utilisateur'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          {member.phone_number && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {member.phone_number}
                            </span>
                          )}
                          {member.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {isOwner ? (
                        <Select
                          value={member.role}
                          onValueChange={(v) => updateMemberRole(member.id, v as VendorTeamRole)}
                        >
                          <SelectTrigger className="w-auto h-7 text-xs border-0 bg-transparent p-0 pr-6">
                            <Badge className={cn("text-xs", rc.color)}>{rc.label}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(roleConfig) as VendorTeamRole[]).map((k) => (
                              <SelectItem key={k} value={k}>{roleConfig[k].label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={cn("text-xs", rc.color)}>{rc.label}</Badge>
                      )}

                      {isOwner && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" disabled={actionLoading}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Retirer ce collaborateur ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {member.display_name || 'Ce membre'} n'aura plus accès à votre espace vendeur.
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
                      )}
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
