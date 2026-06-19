import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralCode: string;
}

export const QRCodeDialog: React.FC<QRCodeDialogProps> = ({ open, onOpenChange, referralCode }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Partager votre code</DialogTitle>
      </DialogHeader>
      <div className="flex justify-center p-6 bg-background rounded-lg border">
        <QRCodeSVG 
          value={`https://tagago.app/app/register?ref=${referralCode}`}
          size={200}
          level="H"
          className="dark:bg-white dark:p-2 dark:rounded"
        />
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Scannez ce code pour partager votre lien de parrainage
      </p>
    </DialogContent>
  </Dialog>
);
