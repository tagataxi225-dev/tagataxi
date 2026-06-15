import React from 'react';
import { Receipt } from 'lucide-react';

export const EmptyTransactions: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-muted/60 rounded-2xl flex items-center justify-center mb-4">
        <Receipt className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">
        Aucune transaction
      </h3>
      <p className="text-xs text-muted-foreground text-center max-w-[240px]">
        Vos transactions apparaîtront ici
      </p>
    </div>
  );
};
