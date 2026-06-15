import React from 'react';
import { ModernActivityScreen } from './ModernActivityScreen';

interface UnifiedActivityScreenProps {
  onBack?: () => void;
}

export const UnifiedActivityScreen = ({ onBack }: UnifiedActivityScreenProps) => {
  return <ModernActivityScreen onBack={onBack} />;
};