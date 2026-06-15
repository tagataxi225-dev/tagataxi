/**
 * 🚗 Gestion Profil VTC
 * Documents et véhicule pour chauffeurs VTC uniquement
 */

import React from 'react';
import { Car } from 'lucide-react';
import { VehicleManagementPanel } from './management/VehicleManagementPanel';
import { DriverDocumentUploader } from './documents/DriverDocumentUploader';

export const VTCProfileManager: React.FC = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Car className="h-5 w-5 text-orange-600" />
        Profil VTC
      </h2>

      {/* Gestion du véhicule VTC */}
      <VehicleManagementPanel />

      {/* Documents VTC - Fonctionnel */}
      <DriverDocumentUploader serviceType="taxi" />
    </div>
  );
};
