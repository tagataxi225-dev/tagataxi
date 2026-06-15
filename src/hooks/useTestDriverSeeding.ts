/**
 * Hook pour créer des chauffeurs de test avec abonnements actifs
 * Utilise l'edge function seed-test-drivers
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SeedResult {
  success: boolean;
  message: string;
  stats: {
    total: number;
    success: number;
    errors: number;
    kinshasa_taxi: number;
    kinshasa_delivery: number;
    abidjan: number;
  };
  drivers: Array<{
    id: string;
    name: string;
    type: string;
    city: string;
    rides_remaining: number;
  }>;
}

export const useTestDriverSeeding = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seedTestDrivers = async (): Promise<SeedResult | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🧪 Lancement du seeding de chauffeurs de test...');

      const { data, error: functionError } = await supabase.functions.invoke('seed-test-drivers', {
        method: 'POST'
      });

      if (functionError) {
        console.error('❌ Erreur edge function:', functionError);
        throw functionError;
      }

      if (!data.success) {
        throw new Error(data.message || 'Échec du seeding');
      }

      console.log('✅ Seeding terminé:', data);

      toast.success(`${data.stats.success} chauffeurs de test créés`, {
        description: `Kinshasa: ${data.stats.kinshasa_taxi + data.stats.kinshasa_delivery}, Abidjan: ${data.stats.abidjan}`,
        duration: 5000
      });

      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ Erreur seeding:', errorMessage);
      setError(errorMessage);
      
      toast.error('Échec du seeding', {
        description: errorMessage,
        duration: 5000
      });

      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearTestDrivers = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🗑️ Suppression des chauffeurs de test...');

      // Supprimer les chauffeurs de test (IDs commencent par 'test-driver-')
      const { error: deleteError } = await supabase
        .from('chauffeurs')
        .delete()
        .like('user_id', 'test-driver-%');

      if (deleteError) {
        throw deleteError;
      }

      toast.success('Chauffeurs de test supprimés', {
        duration: 3000
      });

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ Erreur suppression:', errorMessage);
      setError(errorMessage);
      
      toast.error('Échec de la suppression', {
        description: errorMessage,
        duration: 5000
      });

      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkTestDriversStatus = async () => {
    try {
      const { data: drivers, error } = await supabase
        .from('driver_locations')
        .select(`
          driver_id,
          is_online,
          is_available,
          latitude,
          longitude,
          city
        `)
        .like('driver_id', 'test-driver-%');

      if (error) {
        console.error('Erreur vérification:', error);
        return null;
      }

      return drivers;
    } catch (err) {
      console.error('Erreur:', err);
      return null;
    }
  };

  return {
    loading,
    error,
    seedTestDrivers,
    clearTestDrivers,
    checkTestDriversStatus
  };
};
