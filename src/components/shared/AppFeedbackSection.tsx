import { useState } from 'react';
import { Lightbulb, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'feature', label: 'Nouvelle fonctionnalité' },
  { value: 'bug', label: 'Bug / Problème' },
  { value: 'ui', label: 'Interface' },
  { value: 'other', label: 'Autre' },
] as const;

interface AppFeedbackSectionProps {
  userType: 'client' | 'driver' | 'partner' | 'restaurant';
}

export const AppFeedbackSection = ({ userType }: AppFeedbackSectionProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) return toast.error('Vous devez être connecté');
    const trimmed = message.trim();
    if (!category) return toast.error('Choisissez une catégorie');
    if (trimmed.length < 10) return toast.error('Minimum 10 caractères');
    if (trimmed.length > 500) return toast.error('Maximum 500 caractères');

    setLoading(true);
    const { error } = await supabase.from('user_suggestions' as any).insert({
      user_id: user.id,
      user_type: userType,
      category,
      message: trimmed,
    });
    setLoading(false);

    if (error) {
      console.error('[AppFeedback]', error);
      return toast.error("Erreur lors de l'envoi");
    }

    toast.success('Merci pour votre suggestion ! 💡');
    setCategory('');
    setMessage('');
    setOpen(false);
  };

  return (
    <>
      <div className="flex gap-2 px-4 py-1.5">
        <button
          onClick={() => setOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted/40 border border-border/40 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
        >
          <Lightbulb className="h-4 w-4 text-primary" />
          <span>Suggestion</span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Votre suggestion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="" disabled>Choisir...</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Décrivez votre idée ou problème..."
                maxLength={500}
                rows={4}
              />
              <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
            </div>
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Envoyer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
