/**
 * Hook pour gérer la migration vers les adresses Google Maps
 * Permet de déclencher et suivre la migration batch
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MigrationStatus {
  table: string;
  processed: number;
  total: number;
  isRunning: boolean;
  completed: boolean;
}

export const useGoogleMigration = () => {
  const [migrationStatus, setMigrationStatus] = useState<Record<string, MigrationStatus>>({});
  const [isRunning, setIsRunning] = useState(false);

  const startMigration = async (table: 'driver_locations' | 'transport_bookings' | 'delivery_orders') => {
    setIsRunning(true);
    
    try {
      // Initialiser le statut
      setMigrationStatus(prev => ({
        ...prev,
        [table]: {
          table,
          processed: 0,
          total: 0,
          isRunning: true,
          completed: false
        }
      }));

      // Obtenir le nombre total d'enregistrements à migrer
      const { data: totalData, error: totalError } = await supabase.rpc('migrate_coordinates_to_google_addresses');
      
      if (totalError) {
        throw new Error(`Erreur lors du calcul du total: ${totalError.message}`);
      }

      const total = totalData?.[0]?.[
        table === 'driver_locations' ? 'processed_drivers' :
        table === 'transport_bookings' ? 'processed_bookings' : 'processed_deliveries'
      ] || 0;

      setMigrationStatus(prev => ({
        ...prev,
        [table]: { ...prev[table], total }
      }));

      if (total === 0) {
        toast.success(`Aucune donnée à migrer pour ${table}`);
        setMigrationStatus(prev => ({
          ...prev,
          [table]: { ...prev[table], completed: true, isRunning: false }
        }));
        return;
      }

      // Lancer la migration par batch
      let offset = 0;
      let totalProcessed = 0;
      const batchSize = 50;

      while (true) {
        const { data, error } = await supabase.functions.invoke('batch-geocode-migration', {
          body: {
            table,
            batchSize,
            startOffset: offset
          }
        });

        if (error) {
          throw new Error(`Erreur de migration: ${error.message}`);
        }

        const processed = data.processed || 0;
        totalProcessed += processed;

        // Mettre à jour le statut
        setMigrationStatus(prev => ({
          ...prev,
          [table]: {
            ...prev[table],
            processed: totalProcessed
          }
        }));

        // Vérifier si on a terminé
        if (!data.hasMore || processed === 0) {
          break;
        }

        offset = data.nextOffset;
        
        // Petit délai entre les batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Migration terminée
      setMigrationStatus(prev => ({
        ...prev,
        [table]: {
          ...prev[table],
          completed: true,
          isRunning: false
        }
      }));

      toast.success(`Migration terminée pour ${table}: ${totalProcessed} enregistrements traités`);

    } catch (error) {
      console.error('Erreur de migration:', error);
      toast.error(`Erreur lors de la migration de ${table}: ${error.message}`);
      
      setMigrationStatus(prev => ({
        ...prev,
        [table]: {
          ...prev[table],
          isRunning: false
        }
      }));
    } finally {
      setIsRunning(false);
    }
  };

  const startFullMigration = async () => {
    const tables: Array<'driver_locations' | 'transport_bookings' | 'delivery_orders'> = [
      'driver_locations',
      'transport_bookings', 
      'delivery_orders'
    ];

    for (const table of tables) {
      await startMigration(table);
    }

    toast.success('Migration complète terminée pour toutes les tables !');
  };

  const checkMigrationNeeded = async () => {
    try {
      const { data, error } = await supabase.rpc('migrate_coordinates_to_google_addresses');
      
      if (error) {
        console.error('Erreur lors de la vérification:', error);
        return { driversNeedMigration: 0, bookingsNeedMigration: 0, deliveriesNeedMigration: 0 };
      }

      return {
        driversNeedMigration: data?.[0]?.processed_drivers || 0,
        bookingsNeedMigration: data?.[0]?.processed_bookings || 0,
        deliveriesNeedMigration: data?.[0]?.processed_deliveries || 0
      };
    } catch (error) {
      console.error('Erreur lors de la vérification de migration:', error);
      return { driversNeedMigration: 0, bookingsNeedMigration: 0, deliveriesNeedMigration: 0 };
    }
  };

  return {
    migrationStatus,
    isRunning,
    startMigration,
    startFullMigration,
    checkMigrationNeeded
  };
};