import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTestDataGenerator } from '@/hooks/useTestDataGenerator';
import { 
  Database, 
  Trash2, 
  Users, 
  Car, 
  ShoppingBag, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';

export const TestDataManager: React.FC = () => {
  const { generating, stats, generateAllTestData, clearTestData } = useTestDataGenerator();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gestionnaire de Données de Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Cet outil génère des données de test réalistes pour simuler une plateforme active. 
              Utilisez-le uniquement en développement.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={generateAllTestData}
              disabled={generating}
              className="flex items-center gap-2"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Générer Données de Test
            </Button>
            
            <Button 
              variant="destructive"
              onClick={clearTestData}
              disabled={generating}
              className="flex items-center gap-2"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Supprimer Toutes les Données
            </Button>
          </div>

          {stats && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Données Générées</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Utilisateurs</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{stats.users}</p>
                </div>

                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Car className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Chauffeurs</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{stats.drivers}</p>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-600">Courses</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">{stats.transportBookings}</p>
                </div>

                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">Livraisons</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-700">{stats.deliveryOrders}</p>
                </div>

                <div className="bg-pink-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingBag className="h-4 w-4 text-pink-600" />
                    <span className="text-sm font-medium text-pink-600">Produits</span>
                  </div>
                  <p className="text-2xl font-bold text-pink-700">{stats.marketplaceProducts}</p>
                </div>

                <div className="bg-indigo-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingBag className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-600">Commandes</span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-700">{stats.marketplaceOrders}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Données générées :</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 50 profils utilisateurs avec données réalistes</li>
              <li>• 15 chauffeurs avec véhicules et documents</li>
              <li>• 100 réservations transport (différents statuts)</li>
              <li>• 50 commandes de livraison</li>
              <li>• 30 produits marketplace avec modération</li>
              <li>• 20 commandes marketplace</li>
              <li>• 100 logs d'activité pour historique</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};