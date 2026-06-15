/**
 * Notice de protection de la vie privée pour les chauffeurs
 * Informe les utilisateurs des améliorations de sécurité
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Lock, 
  MapPin, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Info 
} from 'lucide-react';

interface PrivacyProtectionNoticeProps {
  onAcknowledge?: () => void;
  showDetailed?: boolean;
  className?: string;
}

export const PrivacyProtectionNotice: React.FC<PrivacyProtectionNoticeProps> = ({
  onAcknowledge,
  showDetailed = false,
  className
}) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const [showDetails, setShowDetails] = useState(showDetailed);

  const handleAcknowledge = () => {
    setAcknowledged(true);
    onAcknowledge?.();
  };

  if (acknowledged && !showDetailed) {
    return null;
  }

  return (
    <Card className={`border-green-200 bg-green-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-green-600" />
          <CardTitle className="text-green-800 text-lg">
            Protection de la Vie Privée Améliorée
          </CardTitle>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Nouvelle sécurité
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <strong>Sécurisé :</strong> Les coordonnées exactes des chauffeurs sont maintenant protégées. 
            Seuls les chauffeurs eux-mêmes et les administrateurs peuvent accéder à ces informations sensibles.
          </AlertDescription>
        </Alert>

        {showDetails && (
          <div className="space-y-3">
            <h4 className="font-semibold text-green-800 flex items-center">
              <Lock className="h-4 w-4 mr-2" />
              Mesures de Protection Implémentées
            </h4>
            
            <div className="grid gap-3">
              <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-green-100">
                <EyeOff className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm text-green-800">Coordonnées Protégées</p>
                  <p className="text-xs text-green-600">
                    Les positions GPS exactes des chauffeurs ne sont plus visibles publiquement
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-green-100">
                <Users className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm text-green-800">Accès Authentifié</p>
                  <p className="text-xs text-green-600">
                    Seuls les utilisateurs connectés peuvent rechercher des chauffeurs à proximité
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-green-100">
                <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm text-green-800">Information Limitée</p>
                  <p className="text-xs text-green-600">
                    Seules la distance et le temps d'arrivée estimé sont partagés
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-green-100">
                <AlertTriangle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm text-green-800">Limitation des Recherches</p>
                  <p className="text-xs text-green-600">
                    Maximum 10 recherches par utilisateur toutes les 5 minutes pour éviter l'abus
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!showDetailed && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(true)}
              className="text-green-700 border-green-200 hover:bg-green-100"
            >
              <Info className="h-4 w-4 mr-2" />
              Voir les détails
            </Button>
            
            {!acknowledged && (
              <Button
                onClick={handleAcknowledge}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                J'ai compris
              </Button>
            )}
          </div>
        )}

        {showDetails && !acknowledged && (
          <div className="pt-2">
            <Button
              onClick={handleAcknowledge}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Shield className="h-4 w-4 mr-2" />
              Continuer avec la Protection Activée
            </Button>
          </div>
        )}

        <div className="text-xs text-green-600 mt-3 p-2 bg-green-100 rounded">
          <strong>Note :</strong> Ces améliorations protègent la vie privée des chauffeurs tout en 
          maintenant la fonctionnalité de recherche pour les clients authentifiés.
        </div>
      </CardContent>
    </Card>
  );
};