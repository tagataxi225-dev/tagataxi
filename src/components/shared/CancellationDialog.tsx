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
import { AlertCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CancellationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, cancellationType: string) => Promise<void>;
  title?: string;
  userType: 'client' | 'driver';
  bookingType?: 'transport' | 'delivery' | 'marketplace';
  bookingDetails?: {
    id?: string;
    status: string;
    price?: number;
  };
}

const CLIENT_REASONS = [
  "Temps d'attente trop long",
  "Changement de plan",
  "Chauffeur non joignable",
  "Prix trop élevé",
  "Problème technique",
  "Autre (spécifier)"
];

const DRIVER_REASONS = [
  "Client non joignable",
  "Adresse incorrecte/inaccessible",
  "Problème véhicule",
  "Sécurité (zone dangereuse)",
  "Client non présent après 5 min",
  "Autre (spécifier)"
];

const MARKETPLACE_CLIENT_REASONS = [
  "Changement d'avis",
  "Produit non conforme à la description",
  "Délai de livraison trop long",
  "Trouvé moins cher ailleurs",
  "Commande par erreur",
  "Vendeur non responsive",
  "Autre (spécifier)"
];

const MARKETPLACE_SELLER_REASONS = [
  "Produit en rupture de stock",
  "Erreur de prix",
  "Client injoignable",
  "Problème avec le produit",
  "Adresse de livraison incorrecte",
  "Autre (spécifier)"
];

export const CancellationDialog: React.FC<CancellationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Annuler la réservation',
  userType,
  bookingType = 'transport',
  bookingDetails
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [otherReason, setOtherReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = React.useMemo(() => {
    if (bookingType === 'marketplace') {
      return userType === 'client' ? MARKETPLACE_CLIENT_REASONS : MARKETPLACE_SELLER_REASONS;
    }
    return userType === 'client' ? CLIENT_REASONS : DRIVER_REASONS;
  }, [userType, bookingType]);
  const isOtherSelected = selectedReason === "Autre (spécifier)";
  const showWarning = bookingDetails?.status === 'accepted' || bookingDetails?.status === 'driver_assigned';

  const characterCount = otherReason.length;
  const isValidOtherReason = isOtherSelected ? characterCount >= 10 && characterCount <= 500 : true;
  const canSubmit = selectedReason && (isOtherSelected ? isValidOtherReason : true);

  const handleConfirm = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const finalReason = isOtherSelected ? otherReason : selectedReason;
      
      // Determine cancellation type
      let cancellationType = 'customer_request';
      if (bookingType === 'marketplace') {
        cancellationType = userType === 'client' ? 'buyer_cancellation' : 'seller_cancellation';
      } else if (bookingType === 'delivery') {
        cancellationType = userType === 'client' ? 'customer_cancellation' : 'driver_cancellation';
      } else {
        cancellationType = userType === 'client' ? 'customer_cancellation' : 'driver_cancellation';
      }

      await onConfirm(finalReason, cancellationType);
      
      // Reset form
      setSelectedReason('');
      setOtherReason('');
      onClose();
    } catch (error) {
      console.error('Error confirming cancellation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSelectedReason('');
    setOtherReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Veuillez indiquer la raison de l'annulation. Cette information nous aide à améliorer nos services.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {showWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {userType === 'client' 
                  ? "⚠️ L'annulation d'une course déjà acceptée peut entraîner des frais (10% du montant)."
                  : "⚠️ L'annulation d'une course acceptée affectera votre taux de fiabilité et peut entraîner une pénalité."}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Raison de l'annulation <span className="text-destructive">*</span>
            </Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {reasons.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={reason} />
                  <Label htmlFor={reason} className="font-normal cursor-pointer">
                    {reason}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {isOtherSelected && (
            <div className="space-y-2">
              <Label htmlFor="other-reason" className="text-sm font-medium">
                Précisez la raison (minimum 10 caractères)
              </Label>
              <Textarea
                id="other-reason"
                placeholder="Décrivez la raison de votre annulation..."
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                className={`min-h-[100px] resize-none ${
                  otherReason && !isValidOtherReason ? 'border-destructive' : ''
                }`}
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {characterCount < 10 && otherReason.length > 0 && (
                    <span className="text-destructive">Minimum 10 caractères requis</span>
                  )}
                </span>
                <span className={characterCount > 450 ? 'text-warning' : ''}>
                  {characterCount}/500
                </span>
              </div>
            </div>
          )}

          {bookingDetails?.price && showWarning && userType === 'client' && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="text-muted-foreground">
                Montant de la course: <span className="font-semibold">{bookingDetails.price} CDF</span>
              </p>
              <p className="text-muted-foreground">
                Frais d'annulation estimés: <span className="font-semibold text-destructive">
                  {Math.round(bookingDetails.price * 0.1)} CDF (10%)
                </span>
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Retour
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canSubmit || isSubmitting}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            {isSubmitting ? 'Annulation...' : 'Confirmer l\'annulation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
