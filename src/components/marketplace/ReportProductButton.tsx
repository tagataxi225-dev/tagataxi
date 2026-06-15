import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flag, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ReportProductButtonProps {
  productId: string;
  productName: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const REPORT_REASONS = [
  { value: 'inappropriate_images', label: 'Images inappropriées ou trompeuses' },
  { value: 'fake_product', label: 'Produit contrefait ou interdit' },
  { value: 'misleading_description', label: 'Description mensongère' },
  { value: 'suspicious_price', label: 'Prix anormalement bas ou élevé' },
  { value: 'scam', label: 'Arnaque suspectée' },
  { value: 'other', label: 'Autre raison' }
];

export const ReportProductButton: React.FC<ReportProductButtonProps> = ({
  productId,
  productName,
  variant = 'ghost',
  size = 'sm'
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour signaler un produit',
        variant: 'destructive'
      });
      return;
    }

    if (!reason) {
      toast({
        title: 'Raison requise',
        description: 'Veuillez sélectionner une raison de signalement',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('product_reports')
        .insert({
          product_id: productId,
          reporter_id: user.id,
          reason,
          description
        });

      if (error) throw error;

      toast({
        title: '✅ Signalement envoyé',
        description: 'Notre équipe examinera ce produit dans les plus brefs délais'
      });

      setIsOpen(false);
      setReason('');
      setDescription('');
    } catch (error) {
      console.error('Error reporting product:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer le signalement',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className="text-destructive hover:text-destructive"
      >
        <Flag className="h-4 w-4 mr-1" />
        Signaler
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Signaler ce produit
            </DialogTitle>
            <DialogDescription>
              Produit : <span className="font-semibold">{productName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Raison du signalement *</label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sélectionnez une raison" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Détails (optionnel)</label>
              <Textarea
                placeholder="Ajoutez des détails supplémentaires pour nous aider..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>

            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">
                ℹ️ Votre signalement sera examiné par notre équipe. Les faux signalements peuvent entraîner la suspension de votre compte.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={!reason || loading}
            >
              {loading ? 'Envoi...' : 'Envoyer le signalement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};