import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, Users } from 'lucide-react';

interface VehicleOwnershipSelectorProps {
  selectedMode: 'own' | 'partner' | null;
  onModeSelect: (mode: 'own' | 'partner') => void;
  serviceCategory: 'taxi' | 'delivery';
}

export const VehicleOwnershipSelector: React.FC<VehicleOwnershipSelectorProps> = ({
  selectedMode,
  onModeSelect,
  serviceCategory
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold dark:text-gray-200">
        Avez-vous un véhicule ?
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all dark:bg-gray-900/50 dark:border-gray-700 dark:hover:bg-gray-800/50 ${
            selectedMode === 'own' 
              ? 'ring-2 ring-primary bg-primary/5 dark:ring-primary-400' 
              : 'hover:bg-muted/50'
          }`}
          onClick={() => onModeSelect('own')}
        >
          <CardContent className="p-6 text-center">
            <Car className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h4 className="font-semibold mb-2 dark:text-gray-200">J'ai mon véhicule</h4>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              {serviceCategory === 'taxi' 
                ? 'Je possède une voiture pour le transport'
                : 'Je possède un véhicule pour les livraisons'
              }
            </p>
            <ul className="text-xs text-muted-foreground mt-3 space-y-1">
              <li>• Activation rapide</li>
              <li>• Autonomie totale</li>
              <li>• Revenus optimisés</li>
            </ul>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all dark:bg-gray-900/50 dark:border-gray-700 dark:hover:bg-gray-800/50 ${
            selectedMode === 'partner' 
              ? 'ring-2 ring-primary bg-primary/5 dark:ring-primary-400' 
              : 'hover:bg-muted/50'
          }`}
          onClick={() => onModeSelect('partner')}
        >
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h4 className="font-semibold mb-2 dark:text-gray-200">Je cherche un partenaire</h4>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              {serviceCategory === 'taxi'
                ? 'Je veux travailler avec un véhicule de partenaire'
                : 'Je veux livrer avec un véhicule de partenaire'
              }
            </p>
            <ul className="text-xs text-muted-foreground mt-3 space-y-1">
              <li>• Pas d'investissement initial</li>
              <li>• Formation incluse</li>
              <li>• Support partenaire</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};