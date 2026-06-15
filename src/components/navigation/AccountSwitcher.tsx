import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserAccounts } from '@/hooks/useUserAccounts';
import { useAuth } from '@/hooks/useAuth';
import { Check, Plus, Trash2, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const AccountSwitcher = () => {
  const { accounts, activeAccount, switchAccount, addAccount, removeAccount } = useUserAccounts();
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');

  const handleSwitch = async (accountId: string) => {
    const result = await switchAccount(accountId);
    if (result.success) {
      toast.success("Compte basculé avec succès");
      window.location.reload();
    } else {
      toast.error("Impossible de basculer vers ce compte");
    }
  };

  const handleAdd = async () => {
    if (!newEmail) {
      toast.error("Veuillez entrer une adresse email");
      return;
    }

    const result = await addAccount(newEmail, newDisplayName || newEmail);
    if (result.success) {
      toast.success("Compte ajouté avec succès");
      setIsAdding(false);
      setNewEmail('');
      setNewDisplayName('');
    } else {
      toast.error("Impossible d'ajouter ce compte");
    }
  };

  const handleRemove = async (accountId: string) => {
    const result = await removeAccount(accountId);
    if (result.success) {
      toast.success("Compte dissocié");
    } else {
      toast.error("Impossible de supprimer ce compte");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-xl font-bold mb-2">Vos comptes</h3>
        <p className="text-sm text-muted-foreground">
          Basculez entre vos différents comptes Tembea
        </p>
      </div>

      {/* Compte principal (actuel) */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Compte principal
        </h4>
        <motion.div
          className={cn(
            "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all",
            "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
          )}
          whileHover={{ scale: 1.02 }}
        >
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
              {user?.email?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-semibold">{user?.email}</div>
            <div className="text-sm text-muted-foreground">Compte actif</div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 rounded-full">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary">Actif</span>
          </div>
        </motion.div>
      </div>

      {/* Comptes liés */}
      {accounts.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Comptes liés
          </h4>
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2">
              {accounts.map((account) => (
                <motion.div
                  key={account.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer",
                    account.is_active
                      ? "bg-primary/5 border-primary/20"
                      : "bg-card border-border hover:bg-muted/50"
                  )}
                  whileHover={{ x: 4 }}
                  onClick={() => handleSwitch(account.id)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={account.avatar_url || undefined} />
                    <AvatarFallback>
                      {account.display_name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{account.display_name}</div>
                    <div className="text-xs text-muted-foreground">{account.linked_email}</div>
                  </div>
                  {account.is_active && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(account.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Ajouter un compte */}
      {isAdding ? (
        <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border">
          <div className="space-y-2">
            <Label htmlFor="email">Email du compte</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="exemple@email.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Nom d'affichage (optionnel)</Label>
            <Input
              id="displayName"
              placeholder="Mon compte pro"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} className="flex-1">
              Ajouter
            </Button>
            <Button variant="outline" onClick={() => setIsAdding(false)}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full flex items-center gap-3 border-dashed"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-4 w-4" />
          Ajouter un autre compte
        </Button>
      )}
    </div>
  );
};
