import React from 'react';
import { MapPin } from 'lucide-react';
import { useSavedAddresses } from '@/hooks/useSavedAddresses';
import { AddressShortcutButton } from './AddressShortcutButton';
import { AddressChip, AddressData } from './AddressChip';

interface QuickAddressSelectorProps {
  onSelect?: (address: AddressData) => void;
}

export const QuickAddressSelector = ({ onSelect }: QuickAddressSelectorProps) => {
  const { addresses, isLoading } = useSavedAddresses();
  
  // Get top 3 most used addresses
  const topAddresses = [...addresses]
    .sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return (b.usage_count || 0) - (a.usage_count || 0);
    })
    .slice(0, 3) as AddressData[];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse h-14 rounded-2xl bg-muted/30" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Adresses récentes</h3>
        <AddressShortcutButton variant="ghost" size="sm" showIcon={false} />
      </div>
      
      {topAddresses.length > 0 ? (
        <div className="space-y-2">
          {topAddresses.map((address) => (
            <AddressChip
              key={address.id}
              address={address}
              compact
              onClick={() => onSelect?.(address)}
            />
          ))}
        </div>
      ) : (
        <div className="py-6 text-center">
          <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-muted/30 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">Aucune adresse</p>
          <AddressShortcutButton variant="outline" size="sm" />
        </div>
      )}
    </div>
  );
};
