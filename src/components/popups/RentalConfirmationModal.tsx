import { useState } from 'react';
import { Car, Calendar, DollarSign, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

interface RentalConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rentalData: {
    vehicleName: string;
    vehicleImage?: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    currency?: string;
    isPromo?: boolean;
    promoDiscount?: number;
  };
  onConfirm: () => void;
}

export const RentalConfirmationModal = ({
  open,
  onOpenChange,
  rentalData,
  onConfirm
}: RentalConfirmationModalProps) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const currency = 'CDF';

  const finalPrice = rentalData.isPromo && rentalData.promoDiscount
    ? rentalData.totalPrice * (1 - rentalData.promoDiscount / 100)
    : rentalData.totalPrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-hidden">
        {/* Promo Badge */}
        {rentalData.isPromo && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            -{rentalData.promoDiscount}% 🔥
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="text-center text-xl">Confirmer la réservation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vehicle */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            {rentalData.vehicleImage ? (
              <img
                src={rentalData.vehicleImage}
                alt={rentalData.vehicleName}
                className="w-20 h-20 object-cover rounded-lg"
              />
            ) : (
              <div className="w-20 h-20 bg-[#00A651]/10 rounded-lg flex items-center justify-center">
                <Car className="w-10 h-10 text-[#00A651]" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-bold text-lg">{rentalData.vehicleName}</p>
              <p className="text-sm text-muted-foreground">Véhicule de location</p>
            </div>
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Période</p>
                <p className="font-semibold">
                  {rentalData.startDate} → {rentalData.endDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Prix total</p>
                <div className="flex items-center gap-2">
                  {rentalData.isPromo && (
                    <span className="text-sm text-muted-foreground line-through">
                      {rentalData.totalPrice.toLocaleString()} {currency}
                    </span>
                  )}
                  <p className="font-bold text-lg text-[#00A651]">
                    {finalPrice.toLocaleString()} {currency}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Terms */}
          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Conditions importantes</p>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
              <li>Permis de conduire valide requis</li>
              <li>Caution remboursable à la fin de la location</li>
              <li>Assurance tous risques incluse</li>
              <li>Annulation gratuite jusqu'à 24h avant</li>
            </ul>
          </div>

          {/* Checkbox */}
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
            />
            <label
              htmlFor="terms"
              className="text-sm leading-tight cursor-pointer"
            >
              J'accepte les{' '}
              <span className="text-primary font-semibold underline">
                conditions générales
              </span>{' '}
              de location
            </label>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            disabled={!acceptedTerms}
            className="flex-1 bg-[#00A651] hover:bg-[#00A651]/90"
          >
            Confirmer la réservation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
