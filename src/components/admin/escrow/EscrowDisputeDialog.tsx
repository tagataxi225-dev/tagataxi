import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle } from 'lucide-react';

interface EscrowDisputeDialogProps {
  escrow: {
    id: string;
    order_id: string;
    total_amount: number;
  };
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string, notes: string) => void;
}

const DISPUTE_REASONS = [
  { value: 'product_not_received', label: 'Produit non reçu' },
  { value: 'product_damaged', label: 'Produit endommagé' },
  { value: 'wrong_product', label: 'Mauvais produit' },
  { value: 'quality_issue', label: 'Problème de qualité' },
  { value: 'seller_fraud', label: 'Fraude vendeur suspectée' },
  { value: 'buyer_fraud', label: 'Fraude acheteur suspectée' },
  { value: 'delivery_issue', label: 'Problème de livraison' },
  { value: 'other', label: 'Autre raison' },
];

export const EscrowDisputeDialog: React.FC<EscrowDisputeDialogProps> = ({
  escrow,
  open,
  onClose,
  onSubmit
}) => {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!reason) return;
    onSubmit(reason, notes);
    setReason('');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
            Ouvrir un conflit
          </DialogTitle>
          <DialogDescription>
            Commande #{escrow.order_id?.substring(0, 8)} - {escrow.total_amount?.toLocaleString()} FC
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Raison du conflit *</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {DISPUTE_REASONS.map((item) => (
                <div key={item.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={item.value} id={item.value} />
                  <Label htmlFor={item.value} className="font-normal cursor-pointer">
                    {item.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Notes additionnelles</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Décrivez le problème en détail..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!reason}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Ouvrir le conflit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EscrowDisputeDialog;
