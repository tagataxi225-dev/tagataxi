/**
 * 🎁 Section parrainage dans le profil chauffeur
 */

import React from 'react';
import { ReferralDashboard } from '../referral/ReferralDashboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ReferralSectionProps {
  onBack?: () => void;
}

export const ReferralSection: React.FC<ReferralSectionProps> = ({ onBack }) => {
  return (
    <div className="space-y-4">
      {onBack && (
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au profil
        </Button>
      )}
      
      <ReferralDashboard />
    </div>
  );
};
