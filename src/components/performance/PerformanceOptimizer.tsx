/**
 * PerformanceOptimizer — Simplifié
 * Les optimisations CSS sont gérées par dark-mode-improvements.css
 * Ce composant ne fait que passer les enfants sans overhead
 */

import React from 'react';

interface PerformanceOptimizerProps {
  children?: React.ReactNode;
}

export const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({ children }) => {
  return <>{children}</>;
};

export default PerformanceOptimizer;
