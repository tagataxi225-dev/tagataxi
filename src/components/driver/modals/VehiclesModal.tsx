import React from 'react';
import { VehicleManagementPanel } from '../management/VehicleManagementPanel';

export const VehiclesModal: React.FC = () => {
  return (
    <div className="space-y-4">
      <VehicleManagementPanel />
    </div>
  );
};
