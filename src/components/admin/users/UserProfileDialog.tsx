import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MapPin, Calendar, Shield, Activity } from 'lucide-react';

interface UserProfileDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
  user,
  open,
  onOpenChange,
}) => {
  if (!user) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Administrateur', variant: 'destructive' as const },
      driver: { label: 'Chauffeur', variant: 'default' as const },
      partner: { label: 'Partenaire', variant: 'secondary' as const },
      client: { label: 'Client', variant: 'outline' as const },
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || { label: role, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil Utilisateur
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">Informations de base</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Nom complet</p>
                <p className="font-medium">{user.display_name || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Rôle</p>
                <div>{getRoleBadge(user.role)}</div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.phone_number || 'N/A'}</span>
              </div>
              {user.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.city}</span>
                </div>
              )}
            </div>
          </div>

          {/* Statut */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">Statut</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Compte actif</p>
                <Badge variant={user.is_active ? 'default' : 'destructive'}>
                  {user.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              {user.verification_status && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Vérification</p>
                  <Badge variant={user.verification_status === 'verified' ? 'default' : 'outline'}>
                    {user.verification_status}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">Dates</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Inscription</p>
                  <p className="text-sm font-medium">{formatDate(user.created_at)}</p>
                </div>
              </div>
              {user.last_sign_in_at && (
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Dernière connexion</p>
                    <p className="text-sm font-medium">{formatDate(user.last_sign_in_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Statistiques chauffeur */}
          {user.role === 'driver' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">Statistiques Chauffeur</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total courses</p>
                  <p className="text-2xl font-bold">{user.total_rides || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Note moyenne</p>
                  <p className="text-2xl font-bold">{user.rating_average?.toFixed(1) || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
