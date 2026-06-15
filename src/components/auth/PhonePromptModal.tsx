import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface PhonePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhonePromptModal = ({ isOpen, onClose }: PhonePromptModalProps) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const validatePhone = (p: string): boolean => {
    const cleaned = p.replace(/[\s\-]/g, '');
    return /^0[0-9]{8,9}$/.test(cleaned);
  };

  const handleSave = async () => {
    if (!validatePhone(phone)) {
      setError('Format invalide (ex: 0991234567)');
      return;
    }
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const cleaned = phone.replace(/[\s\-]/g, '');

      // Update profiles table
      await supabase
        .from('profiles')
        .update({ phone_number: cleaned })
        .eq('user_id', user.id);

      // Update clients table if exists
      await supabase
        .from('clients')
        .update({ phone_number: cleaned })
        .eq('user_id', user.id);

      localStorage.setItem('kwenda_phone_prompt_dismissed', 'true');
      toast.success('Numéro enregistré ! Vous pouvez maintenant vous connecter avec.');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('kwenda_phone_prompt_dismissed', 'true');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg">Ajoutez votre numéro</DialogTitle>
          </div>
          <DialogDescription>
            Connectez-vous plus facilement avec votre numéro de téléphone la prochaine fois.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="phone-prompt">Numéro de téléphone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone-prompt"
                type="tel"
                placeholder="0991234567"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError(null);
                }}
                className="pl-10"
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-1"
              disabled={loading}
            >
              Plus tard
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={loading || !phone}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
