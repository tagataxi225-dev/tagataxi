import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, AlertTriangle, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeliveryConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string;
  transactionId?: string;
  onConfirm?: (transactionId: string, confirmationData: any) => void;
  isMarketplace?: boolean;
}

export const DeliveryConfirmationDialog: React.FC<DeliveryConfirmationDialogProps> = ({
  open,
  onOpenChange,
  orderId,
  transactionId,
  onConfirm,
  isMarketplace = false
}) => {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [clientConfirmed, setClientConfirmed] = useState(false);
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);
  const [satisfactionConfirmed, setSatisfactionConfirmed] = useState(false);
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientConfirmed || !deliveryConfirmed || !satisfactionConfirmed) {
      return;
    }

    setLoading(true);

    try {
      if (isMarketplace && orderId) {
        const { data, error } = await supabase.functions.invoke('complete-marketplace-order', {
          body: { orderId, rating: rating > 0 ? rating : undefined, feedback: null }
        });

        if (error) throw error;
        toast.success('Fonds libérés avec succès !');
        onOpenChange(false);
        resetForm();
      } else if (onConfirm && transactionId) {
        await onConfirm(transactionId, {
          confirmationCode: confirmationCode || `AUTO-${Date.now()}`,
          clientConfirmed: true,
          deliveryConfirmed,
          satisfactionConfirmed
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors de la confirmation');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setConfirmationCode('');
    setClientConfirmed(false);
    setDeliveryConfirmed(false);
    setSatisfactionConfirmed(false);
    setRating(0);
  };

  const allConfirmed = clientConfirmed && deliveryConfirmed && satisfactionConfirmed;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Confirmer la réception
          </DialogTitle>
          <DialogDescription>
            Confirmez que vous avez bien reçu votre commande avant de libérer les fonds.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isMarketplace && (
            <div className="space-y-2">
              <Label htmlFor="code">Code de confirmation (optionnel)</Label>
              <Input
                id="code"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                placeholder="Code fourni par le livreur"
              />
            </div>
          )}

          {isMarketplace && (
            <div className="space-y-2">
              <Label>Noter votre expérience (optionnel)</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="delivery-confirmed"
                checked={deliveryConfirmed}
                onCheckedChange={(checked) => setDeliveryConfirmed(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="delivery-confirmed" className="text-sm font-normal cursor-pointer">
                  J'ai bien reçu ma commande
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="satisfaction-confirmed"
                checked={satisfactionConfirmed}
                onCheckedChange={(checked) => setSatisfactionConfirmed(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="satisfaction-confirmed" className="text-sm font-normal cursor-pointer">
                  Je suis satisfait(e) de ma commande
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="client-confirmed"
                checked={clientConfirmed}
                onCheckedChange={(checked) => setClientConfirmed(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="client-confirmed" className="text-sm font-normal cursor-pointer">
                  Je confirme la libération des fonds
                </Label>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Attention</p>
              <p className="text-amber-700">
                Action irréversible. Les fonds seront immédiatement libérés.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !allConfirmed}
              className="flex-1"
            >
              {loading ? 'Confirmation...' : 'Confirmer la réception'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
