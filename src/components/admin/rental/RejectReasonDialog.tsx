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
import { AlertCircle } from 'lucide-react';

interface RejectReasonDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  vehicleName: string;
  isLoading?: boolean;
}

export const RejectReasonDialog = ({
  open,
  onClose,
  onConfirm,
  vehicleName,
  isLoading
}: RejectReasonDialogProps) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason);
      setReason('');
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  const commonReasons = [
    'Photos de mauvaise qualité',
    'Informations incomplètes',
    'Tarifs non conformes',
    'Véhicule en mauvais état',
    'Documents manquants'
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Rejeter le véhicule
          </DialogTitle>
          <DialogDescription>
            Véhicule: <strong>{vehicleName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Raison du rejet *</Label>
            <Textarea
              id="reason"
              placeholder="Expliquez pourquoi ce véhicule est rejeté..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Raisons courantes:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {commonReasons.map((r) => (
                <Button
                  key={r}
                  variant="outline"
                  size="sm"
                  onClick={() => setReason(r)}
                  type="button"
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
          >
            {isLoading ? 'Rejet en cours...' : 'Confirmer le rejet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};