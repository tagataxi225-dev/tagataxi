/**
 * ⚡ PHASE 3: Barre d'actions rapides
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Navigation, Phone, CheckCircle } from 'lucide-react';

interface QuickActionsBarProps {
  onNavigate: () => void;
  onCall?: () => void;
  onComplete: () => void;
  customerPhone?: string;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onNavigate,
  onCall,
  onComplete,
  customerPhone
}) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {/* GPS */}
      <Button
        onClick={onNavigate}
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 flex-col h-auto py-2"
      >
        <Navigation className="h-4 w-4 mb-1" />
        <span className="text-xs">GPS</span>
      </Button>

      {/* Appeler */}
      {customerPhone && onCall && (
        <Button
          onClick={onCall}
          variant="outline"
          size="sm"
          className="flex-col h-auto py-2 border-2"
        >
          <Phone className="h-4 w-4 mb-1" />
          <span className="text-xs">Appeler</span>
        </Button>
      )}

      {/* Terminé */}
      <Button
        onClick={onComplete}
        variant="outline"
        size="sm"
        className="flex-col h-auto py-2 border-2 border-green-500 text-green-600 hover:bg-green-50"
      >
        <CheckCircle className="h-4 w-4 mb-1" />
        <span className="text-xs">Terminé</span>
      </Button>
    </div>
  );
};
