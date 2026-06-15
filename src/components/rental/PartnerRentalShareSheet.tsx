import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerHandle } from '@/components/ui/drawer';
import { PartnerRentalShareButtons } from './PartnerRentalShareButtons';

interface PartnerRentalShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  partnerName: string;
  totalVehicles: number;
  rating?: number;
  slogan?: string;
}

export const PartnerRentalShareSheet: React.FC<PartnerRentalShareSheetProps> = ({
  open,
  onOpenChange,
  partnerId,
  partnerName,
  totalVehicles,
  rating,
  slogan
}) => {
  const isMobile = useIsMobile();

  const shareContent = (
    <PartnerRentalShareButtons
      partnerId={partnerId}
      partnerName={partnerName}
      totalVehicles={totalVehicles}
      rating={rating}
      slogan={slogan}
    />
  );

  // Mobile: Drawer (sheet from bottom)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHandle />
          <DrawerHeader className="text-left pb-4">
            <DrawerTitle className="text-2xl">
              Partager {partnerName}
            </DrawerTitle>
            <DrawerDescription>
              Invitez vos amis à découvrir cette agence de location
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-6 pb-8 overflow-y-auto">
            {shareContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Dialog (centered modal)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Partager {partnerName}
          </DialogTitle>
          <DialogDescription>
            Invitez vos amis à découvrir cette agence de location
          </DialogDescription>
        </DialogHeader>
        {shareContent}
      </DialogContent>
    </Dialog>
  );
};
