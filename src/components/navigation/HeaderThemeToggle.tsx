import React from 'react';
import { EnhancedThemeToggle } from '@/components/theme/EnhancedThemeToggle';

export const HeaderThemeToggle = () => {
  return (
    <div className="fixed top-4 left-4 z-50">
      <EnhancedThemeToggle variant="icon" size="lg" className="bg-card border border-border shadow-lg hover:bg-accent/20" />
    </div>
  );
};