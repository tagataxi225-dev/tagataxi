import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface UserEditDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const UserEditDialog: React.FC<UserEditDialogProps> = ({
  user,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [verificationStatus, setVerificationStatus] = useState(user?.verification_status || 'pending');

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const tableName = 
        user.role === 'driver' ? 'chauffeurs' :
        user.role === 'partner' ? 'partenaires' :
        user.role === 'admin' ? 'admins' : 'clients';

      const updates: any = {
        is_active: isActive,
        updated_at: new Date().toISOString(),
      };

      if (user.role === 'driver' && verificationStatus) {
        updates.verification_status = verificationStatus;
      }

      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Les modifications ont été enregistrées',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour l\'utilisateur',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nom (lecture seule) */}
          <div className="space-y-2">
            <Label>Nom complet</Label>
            <p className="text-sm text-muted-foreground">{user.display_name}</p>
          </div>

          {/* Email (lecture seule) */}
          <div className="space-y-2">
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          {/* Rôle (lecture seule) */}
          <div className="space-y-2">
            <Label>Rôle</Label>
            <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
          </div>

          {/* Statut actif */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Compte actif</Label>
              <p className="text-sm text-muted-foreground">
                Activer ou désactiver le compte utilisateur
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={loading}
            />
          </div>

          {/* Statut de vérification (chauffeurs uniquement) */}
          {user.role === 'driver' && (
            <div className="space-y-2">
              <Label>Statut de vérification</Label>
              <Select
                value={verificationStatus}
                onValueChange={setVerificationStatus}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="verified">Vérifié</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
