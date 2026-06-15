import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FoodDisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  amount: number;
  onSuccess?: () => void;
}

const DISPUTE_REASONS = [
  { id: 'not_delivered', label: 'Commande non livrée', description: 'Le client affirme ne pas avoir reçu sa commande' },
  { id: 'wrong_items', label: 'Articles incorrects', description: 'Les articles livrés ne correspondent pas à la commande' },
  { id: 'quality_issue', label: 'Problème de qualité', description: 'Plainte sur la qualité des plats' },
  { id: 'partial_delivery', label: 'Livraison partielle', description: 'Des articles manquent dans la commande' },
  { id: 'other', label: 'Autre raison', description: 'Une autre raison non listée' },
];

export function FoodDisputeDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  amount,
  onSuccess
}: FoodDisputeDialogProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une raison",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Update escrow transaction to disputed status
      const { error } = await supabase
        .from('escrow_transactions')
        .update({ 
          status: 'disputed',
          dispute_reason: `${reason}: ${details}`
        })
        .eq('order_id', orderId);

      if (error) throw error;

      toast({
        title: "Litige ouvert",
        description: "Notre équipe va examiner votre demande sous 24h",
      });

      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      setReason('');
      setDetails('');
    } catch (error: any) {
      console.error('Error creating dispute:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le litige",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Ouvrir un litige
          </DialogTitle>
          <DialogDescription>
            Commande #{orderNumber} • {amount.toLocaleString()} CDF
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason Selection */}
          <div className="space-y-3">
            <Label>Raison du litige</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {DISPUTE_REASONS.map((r) => (
                <div
                  key={r.id}
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    reason === r.id 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setReason(r.id)}
                >
                  <RadioGroupItem value={r.id} id={r.id} className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor={r.id} className="font-medium cursor-pointer">
                      {r.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <Label htmlFor="details">Détails supplémentaires</Label>
            <Textarea
              id="details"
              placeholder="Décrivez le problème en détail..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
            />
          </div>

          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">Important</p>
                <p className="text-xs mt-1">
                  L'ouverture d'un litige bloque le paiement jusqu'à résolution. 
                  Notre équipe examinera les preuves des deux parties.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !reason}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              'Ouvrir le litige'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
