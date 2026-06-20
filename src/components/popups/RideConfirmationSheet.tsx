import { MapPin, Clock, Wallet } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface RideConfirmationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideData: {
    pickup: string;
    destination: string;
    price: number;
    estimatedTime: string;
    vehicleType: string;
    currency?: string;
  };
  onConfirm: () => void;
  paymentMethod?: 'wallet' | 'mobile_money' | 'cash';
}

export const RideConfirmationSheet = ({
  open,
  onOpenChange,
  rideData,
  onConfirm,
  paymentMethod = 'wallet'
}: RideConfirmationSheetProps) => {
  const currency = rideData.currency || 'XOF';

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-[32px]">
        <DrawerHeader>
          <DrawerTitle className="text-lg font-bold">Confirmer la course</DrawerTitle>
        </DrawerHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Route */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <div className="w-0.5 h-8 bg-border" />
                <MapPin className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Départ</p>
                  <p className="font-semibold">{rideData.pickup}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Destination</p>
                  <p className="font-semibold">{rideData.destination}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Durée estimée</span>
              </div>
              <span className="font-semibold">{rideData.estimatedTime}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="w-4 h-4" />
                <span>Paiement</span>
              </div>
              <span className="font-semibold capitalize">
                {paymentMethod === 'wallet' ? 'TAGAPay' : 
                 paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Espèces'}
              </span>
            </div>
          </div>

          <Separator />

          {/* Price */}
          <div className="flex items-center justify-between py-2">
            <span className="text-lg font-bold">Prix total</span>
            <span className="text-2xl font-extrabold text-primary">
              {rideData.price.toLocaleString()} {currency}
            </span>
          </div>
        </div>

        <DrawerFooter className="px-6 pb-8">
          <Button 
            size="lg" 
            className="w-full text-base font-semibold"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Confirmer la course
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
