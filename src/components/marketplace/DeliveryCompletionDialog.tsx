import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

interface DeliveryCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  driverId: string;
  deliveryFee: number;
  paymentMethod: 'wallet' | 'cash_on_delivery';
  onComplete?: () => void;
}

export const DeliveryCompletionDialog: React.FC<DeliveryCompletionDialogProps> = ({
  open,
  onOpenChange,
  orderId,
  driverId,
  deliveryFee,
  paymentMethod,
  onComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');
  const [cashCollected, setCashCollected] = useState(false);
  const [cashAmount, setCashAmount] = useState(deliveryFee.toString());
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const isCashPayment = paymentMethod === 'cash_on_delivery';

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComplete = async () => {
    if (!recipientName.trim()) {
      toast.error('Veuillez saisir le nom du destinataire');
      return;
    }

    if (isCashPayment && !cashCollected) {
      toast.error('Veuillez confirmer la collecte du paiement en espèces');
      return;
    }

    setLoading(true);
    try {
      let deliveryProofUrl = null;

      // Upload photo si fournie
      if (photoFile) {
        const fileName = `delivery-proof-${orderId}-${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('delivery-proofs')
          .upload(fileName, photoFile);

        if (uploadError) {
          console.error('Error uploading photo:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('delivery-proofs')
            .getPublicUrl(uploadData.path);
          deliveryProofUrl = urlData.publicUrl;
        }
      }

      // Appeler l'edge function
      const { data, error } = await supabase.functions.invoke('complete-delivery-with-payment', {
        body: {
          orderId,
          driverId,
          deliveryProof: deliveryProofUrl ? { url: deliveryProofUrl } : null,
          cashCollected: isCashPayment ? cashCollected : false,
          cashAmount: isCashPayment && cashCollected ? parseFloat(cashAmount) : 0,
          recipientName: recipientName.trim(),
          notes: notes.trim()
        }
      });

      if (error) throw error;

      toast.success('Livraison confirmée avec succès !');
      onComplete?.();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error completing delivery:', error);
      toast.error('Erreur lors de la confirmation de livraison');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRecipientName('');
    setNotes('');
    setCashCollected(false);
    setCashAmount(deliveryFee.toString());
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Confirmer la livraison
          </DialogTitle>
          <DialogDescription>
            Remplissez les détails de la livraison pour finaliser
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nom du destinataire */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Nom du destinataire *</Label>
            <Input
              id="recipient"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Nom complet de la personne qui a reçu"
            />
          </div>

          {/* Photo de preuve */}
          <div className="space-y-2">
            <Label>Photo de preuve (optionnel)</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('photo-input')?.click()}
              >
                <Camera className="h-4 w-4 mr-2" />
                {photoFile ? 'Changer photo' : 'Prendre photo'}
              </Button>
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
            {photoPreview && (
              <img
                src={photoPreview}
                alt="Preuve de livraison"
                className="w-full h-40 object-cover rounded-lg border"
              />
            )}
          </div>

          {/* Paiement cash si applicable */}
          {isCashPayment && (
            <div className="space-y-3 bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <DollarSign className="h-5 w-5 text-orange-500 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    Paiement en espèces requis
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="cashAmount">Montant collecté (FC)</Label>
                    <Input
                      id="cashAmount"
                      type="number"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      min={0}
                    />
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="cashCollected"
                      checked={cashCollected}
                      onCheckedChange={(checked) => setCashCollected(checked as boolean)}
                    />
                    <Label
                      htmlFor="cashCollected"
                      className="text-sm cursor-pointer leading-tight"
                    >
                      J'ai collecté {cashAmount} FC en espèces auprès du client
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Remarques ou commentaires..."
              rows={3}
            />
          </div>

          {/* Avertissement */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Cette action est irréversible. Assurez-vous que le colis a bien été remis au destinataire.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleComplete}
            disabled={loading || !recipientName.trim() || (isCashPayment && !cashCollected)}
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {loading ? 'Confirmation...' : 'Confirmer livraison'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
