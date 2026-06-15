import React from 'react';
import { UnifiedTopUpModal } from '@/components/wallet/UnifiedTopUpModal';

interface PartnerTopUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  currency?: string;
  onSuccess?: () => void;
}

export const PartnerTopUpDialog: React.FC<PartnerTopUpDialogProps> = ({
  open,
  onOpenChange,
  currentBalance,
  currency = 'CDF',
  onSuccess
}) => {
  return (
    <UnifiedTopUpModal
      open={open}
      onClose={() => onOpenChange(false)}
      userType="partner"
      walletBalance={currentBalance}
      currency={currency}
      onSuccess={onSuccess}
    />
  );
};
