import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook pour simuler des chauffeurs en ligne pour les tests
 */
export function useDriverSimulation() {
  
  const createTestDrivers = async () => {
    try {
      console.log('🚗 Création de 5 chauffeurs de test avec GPS Abidjan...');

      // 5 chauffeurs de test dans différentes zones d'Abidjan
      const testDrivers = [
        {
          driver_id: '550e8400-e29b-41d4-a716-446655440001',
          latitude: 5.3544,  // Centre Abidjan
          longitude: -4.0017,
          heading: 45,
          is_online: true,
          is_available: true,
          vehicle_class: 'taxi_standard',
          last_ping: new Date().toISOString(),
          is_verified: true
        },
        {
          driver_id: '550e8400-e29b-41d4-a716-446655440002',
          latitude: 5.3600,  // Plateau
          longitude: -4.0100,
          heading: 90,
          is_online: true,
          is_available: true,
          vehicle_class: 'taxi_premium',
          last_ping: new Date().toISOString(),
          is_verified: true
        },
        {
          driver_id: '550e8400-e29b-41d4-a716-446655440003',
          latitude: 5.3490,  // Yopougon (proche position utilisateur)
          longitude: -4.0768,
          heading: 180,
          is_online: true,
          is_available: true,
          vehicle_class: 'moto_transport',
          last_ping: new Date().toISOString(),
          is_verified: true
        },
        {
          driver_id: '550e8400-e29b-41d4-a716-446655440004',
          latitude: 5.3400,  // Treichville
          longitude: -3.9900,
          heading: 270,
          is_online: true,
          is_available: true,
          vehicle_class: 'taxi_standard',
          last_ping: new Date().toISOString(),
          is_verified: true
        },
        {
          driver_id: '550e8400-e29b-41d4-a716-446655440005',
          latitude: 5.3700,  // Cocody
          longitude: -4.0200,
          heading: 135,
          is_online: true,
          is_available: true,
          vehicle_class: 'taxi_premium',
          last_ping: new Date().toISOString(),
          is_verified: true
        }
      ];

      // Supprimer les anciens chauffeurs de test puis insérer les nouveaux
      await supabase
        .from('driver_locations')
        .delete()
        .in('driver_id', testDrivers.map(d => d.driver_id));

      const { error } = await supabase
        .from('driver_locations')
        .insert(testDrivers);

      if (error) {
        console.error('Erreur création chauffeurs test:', error);
        return false;
      }

      console.log('✅ 5 chauffeurs de test créés avec positions GPS à Abidjan');
      return true;

    } catch (error) {
      console.error('Erreur simulation chauffeurs:', error);
      return false;
    }
  };

  const startDriverSimulation = async () => {
    const success = await createTestDrivers();
    if (success) {
      toast.success('🚗 5 chauffeurs créés avec positions GPS à Abidjan');
    } else {
      toast.error('Erreur lors de la création des chauffeurs de test');
    }
  };

  const stopDriverSimulation = async () => {
    try {
      // Supprimer tous les chauffeurs de test
      const { error } = await supabase
        .from('driver_locations')
        .delete()
        .like('driver_id', '550e8400-e29b-41d4-a716-44665544%');

      if (error) {
        console.error('Erreur suppression chauffeurs test:', error);
        toast.error('Erreur lors de la suppression des chauffeurs de test');
        return;
      }

      toast.info('Chauffeurs de test supprimés');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return {
    startDriverSimulation,
    stopDriverSimulation,
    createTestDrivers
  };
}