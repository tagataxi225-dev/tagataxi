/**
 * Composant d'administration pour gérer les chauffeurs de test
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTestDriverSeeding } from '@/hooks/useTestDriverSeeding';
import { Users, Loader2, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const TestDriverManager = () => {
  const { loading, error, seedTestDrivers, clearTestDrivers, checkTestDriversStatus } = useTestDriverSeeding();
  const [lastSeedResult, setLastSeedResult] = useState<any>(null);
  const [driversStatus, setDriversStatus] = useState<any[]>([]);

  const handleSeed = async () => {
    const result = await seedTestDrivers();
    if (result) {
      setLastSeedResult(result);
    }
  };

  const handleClear = async () => {
    const confirmed = window.confirm('Supprimer TOUS les chauffeurs de test ?');
    if (confirmed) {
      await clearTestDrivers();
      setLastSeedResult(null);
      setDriversStatus([]);
    }
  };

  const handleCheckStatus = async () => {
    const status = await checkTestDriversStatus();
    if (status) {
      setDriversStatus(status);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          Gestion des Chauffeurs de Test
        </CardTitle>
        <CardDescription>
          Créer et gérer des chauffeurs de test avec abonnements actifs pour tester le système de dispatching
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Actions principales */}
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={handleSeed}
            disabled={loading}
            size="lg"
            className="flex-1 min-w-[200px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Users className="mr-2 h-5 w-5" />
                Créer 10 Chauffeurs de Test
              </>
            )}
          </Button>

          <Button
            onClick={handleCheckStatus}
            disabled={loading}
            variant="outline"
            size="lg"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Vérifier Statut
          </Button>

          <Button
            onClick={handleClear}
            disabled={loading}
            variant="destructive"
            size="lg"
          >
            <Trash2 className="mr-2 h-5 w-5" />
            Supprimer Tout
          </Button>
        </div>

        {/* Erreur */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Résultats du dernier seeding */}
        {lastSeedResult && (
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Seeding Réussi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{lastSeedResult.stats.success}</div>
                  <div className="text-sm text-muted-foreground">Créés</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{lastSeedResult.stats.kinshasa_taxi}</div>
                  <div className="text-sm text-muted-foreground">Taxi Kinshasa</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{lastSeedResult.stats.kinshasa_delivery}</div>
                  <div className="text-sm text-muted-foreground">Livraison KIN</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{lastSeedResult.stats.abidjan}</div>
                  <div className="text-sm text-muted-foreground">Abidjan</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Chauffeurs créés:</h4>
                <div className="grid gap-2">
                  {lastSeedResult.drivers.map((driver: any) => (
                    <div key={driver.id} className="flex items-center justify-between bg-white dark:bg-gray-900 p-2 rounded">
                      <div>
                        <span className="font-medium">{driver.name}</span>
                        <Badge variant="outline" className="ml-2">{driver.type}</Badge>
                        <Badge variant="secondary" className="ml-1">{driver.city}</Badge>
                      </div>
                      <Badge variant="default">
                        {driver.rides_remaining} courses
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statut des chauffeurs */}
        {driversStatus.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statut des Chauffeurs ({driversStatus.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {driversStatus.map((driver) => (
                  <div key={driver.driver_id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${driver.is_online ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="font-mono text-sm">{driver.driver_id}</span>
                      <Badge variant="outline">{driver.city}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={driver.is_available ? 'default' : 'secondary'}>
                        {driver.is_available ? 'Disponible' : 'Occupé'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ({driver.latitude.toFixed(4)}, {driver.longitude.toFixed(4)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documentation */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg">📋 Chauffeurs de Test Inclus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <h5 className="font-semibold mb-1">🇨🇩 Kinshasa (7 chauffeurs):</h5>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>5 chauffeurs TAXI (VTC Standard, Premium, Taxi-bus, Moto)</li>
                  <li>2 livreurs DELIVERY (Moto, Voiture)</li>
                  <li>Tous avec <code>rides_remaining &gt; 0</code></li>
                  <li>Positions GPS réparties: Gombe, Matonge, Limete, Kalamu, Ngaliema</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold mb-1">🇨🇮 Abidjan (3 chauffeurs):</h5>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>2 chauffeurs TAXI (Wôrô-wôrô, Moto-taxi)</li>
                  <li>Position proche de Yopougon pour tests</li>
                </ul>
              </div>
              <div className="pt-2 border-t">
                <h5 className="font-semibold mb-1">✅ Vérifications post-seeding:</h5>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Statut: <code>is_online=true</code>, <code>is_available=true</code></li>
                  <li>Vérification: <code>verification_status='verified'</code></li>
                  <li>Abonnements actifs avec <code>end_date</code> dans 30 jours</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};
