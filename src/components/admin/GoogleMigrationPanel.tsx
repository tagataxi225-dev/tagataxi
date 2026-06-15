/**
 * Panel d'administration pour gérer la migration Google Maps
 * Permet de déclencher et suivre la migration des coordonnées
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useGoogleMigration } from '@/hooks/useGoogleMigration';
import { MapPin, Database, CheckCircle, AlertCircle, Play } from 'lucide-react';

export const GoogleMigrationPanel = () => {
  const { 
    migrationStatus, 
    isRunning, 
    startMigration, 
    startFullMigration, 
    checkMigrationNeeded 
  } = useGoogleMigration();

  const [migrationNeeded, setMigrationNeeded] = useState({
    driversNeedMigration: 0,
    bookingsNeedMigration: 0,
    deliveriesNeedMigration: 0
  });

  useEffect(() => {
    checkMigrationNeeded().then(setMigrationNeeded);
  }, []);

  const tables = [
    {
      key: 'driver_locations' as const,
      name: 'Positions Chauffeurs',
      icon: MapPin,
      needMigration: migrationNeeded.driversNeedMigration
    },
    {
      key: 'transport_bookings' as const,
      name: 'Réservations Transport',
      icon: Database,
      needMigration: migrationNeeded.bookingsNeedMigration
    },
    {
      key: 'delivery_orders' as const,
      name: 'Commandes Livraison',
      icon: Database,
      needMigration: migrationNeeded.deliveriesNeedMigration
    }
  ];

  const totalNeedMigration = Object.values(migrationNeeded).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Migration Google Maps - Adresses Réelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalNeedMigration}</div>
              <div className="text-sm text-muted-foreground">Enregistrements à migrer</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(migrationStatus).reduce((sum, status) => sum + status.processed, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Déjà migrés</div>
            </div>
            <div className="text-center">
              <Badge variant={totalNeedMigration > 0 ? "destructive" : "secondary"}>
                {totalNeedMigration > 0 ? "Migration requise" : "À jour"}
              </Badge>
            </div>
          </div>

          {totalNeedMigration > 0 && (
            <div className="flex gap-2">
              <Button 
                onClick={startFullMigration}
                disabled={isRunning}
                className="flex-1"
              >
                <Play className="w-4 h-4 mr-2" />
                Migrer Toutes les Tables
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tables.map((table) => {
          const status = migrationStatus[table.key];
          const Icon = table.icon;
          const progress = status?.total ? (status.processed / status.total) * 100 : 0;

          return (
            <Card key={table.key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {table.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">À migrer:</span>
                  <Badge variant={table.needMigration > 0 ? "secondary" : "outline"}>
                    {table.needMigration}
                  </Badge>
                </div>

                {status && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progression</span>
                        <span>{status.processed} / {status.total}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="flex items-center gap-2">
                      {status.completed ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : status.isRunning ? (
                        <AlertCircle className="w-4 h-4 text-orange-500 animate-pulse" />
                      ) : null}
                      
                      <span className="text-xs text-muted-foreground">
                        {status.completed ? 'Terminé' : 
                         status.isRunning ? 'En cours...' : 'En attente'}
                      </span>
                    </div>
                  </>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startMigration(table.key)}
                  disabled={isRunning || table.needMigration === 0}
                  className="w-full"
                >
                  {status?.isRunning ? 'Migration...' : 'Migrer'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">📋 Informations de Migration</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>• <strong>Phase 4 complétée :</strong> Colonnes Google Maps ajoutées à toutes les tables</p>
          <p>• <strong>Geocoding intelligent :</strong> Utilise l'API Google Maps avec fallback</p>
          <p>• <strong>Cache automatique :</strong> Évite les appels redondants à l'API</p>
          <p>• <strong>Migration par lots :</strong> Traite les données par petits groupes</p>
          <p>• <strong>Adresses réelles :</strong> Remplace les coordonnées brutes par des adresses Google</p>
        </CardContent>
      </Card>
    </div>
  );
};