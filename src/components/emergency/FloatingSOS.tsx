/**
 * Bouton SOS flottant compact pour les écrans de course active
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Shield } from 'lucide-react';
import PanicButton from './PanicButton';

interface FloatingSOSProps {
  tripId?: string;
}

export const FloatingSOS: React.FC<FloatingSOSProps> = ({ tripId }) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="destructive"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg animate-pulse hover:animate-none"
          aria-label="SOS - Alerte d'urgence"
        >
          <Shield className="h-7 w-7" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-destructive flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Alerte d'urgence
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <PanicButton
            tripId={tripId}
            showEmergencyContacts={true}
            autoSendLocation={true}
            onEmergencyTriggered={() => {}}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FloatingSOS;
