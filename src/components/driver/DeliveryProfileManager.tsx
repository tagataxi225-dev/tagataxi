/**
 * 📦 Gestion Profil Livraison
 * Capacité et documents pour livreurs uniquement
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Bike } from 'lucide-react';
import { VehicleManagementPanel } from './management/VehicleManagementPanel';
import { DriverDocumentUploader } from './documents/DriverDocumentUploader';

export const DeliveryProfileManager: React.FC = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Package className="h-5 w-5 text-blue-600" />
        Profil Livraison
      </h2>

      {/* Gestion du véhicule de livraison */}
      <VehicleManagementPanel />

      {/* Capacité de livraison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bike className="h-5 w-5" />
            Capacité de livraison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            📦 Type de véhicule : Moto, Voiture, Camionnette
          </p>
          {/* TODO: Ajouter sélecteur capacité */}
        </CardContent>
      </Card>

      {/* Documents livraison - Fonctionnel */}
      <DriverDocumentUploader serviceType="delivery" />
    </div>
  );
};
