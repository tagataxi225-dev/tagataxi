/**
 * 🏠 Hook pour récupérer les lieux favoris de l'utilisateur
 * Pour MVP : Génère des suggestions intelligentes basées sur la ville
 * Future : Récupérer depuis profiles quand home_address/work_address seront ajoutés
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { SUPPORTED_CITIES } from '@/types/unifiedLocation';

interface FavoritePlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'home' | 'work';
}

export const useUserFavorites = (city: string = 'Kinshasa') => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoritePlace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        // 🔄 Future : Requête DB quand champs ajoutés
        // const { data } = await supabase
        //   .from('profiles')
        //   .select('home_address, work_address, home_coordinates, work_coordinates')
        //   .eq('user_id', user.id)
        //   .single();

        // 🎯 Pour MVP : Suggestions intelligentes par ville
        const cityConfig = SUPPORTED_CITIES[city.toLowerCase()] || SUPPORTED_CITIES.kinshasa;
        
        // Suggestions populaires basées sur la ville
        const citySuggestions: Record<string, FavoritePlace[]> = {
          'Kinshasa': [
            {
              id: 'home-kin',
              name: 'Maison',
              address: 'Gombe, Kinshasa',
              lat: -4.3217,
              lng: 15.3069,
              type: 'home'
            },
            {
              id: 'work-kin',
              name: 'Travail',
              address: 'Centre-ville, Gombe',
              lat: -4.3097,
              lng: 15.2973,
              type: 'work'
            }
          ],
          'Lubumbashi': [
            {
              id: 'home-lub',
              name: 'Maison',
              address: 'Lubumbashi Centre',
              lat: -11.6792,
              lng: 27.4716,
              type: 'home'
            },
            {
              id: 'work-lub',
              name: 'Travail',
              address: 'Kenya, Lubumbashi',
              lat: -11.6450,
              lng: 27.4800,
              type: 'work'
            }
          ]
        };

        setFavorites(citySuggestions[city] || citySuggestions['Kinshasa']);
      } catch (error) {
        console.error('❌ Erreur chargement favoris:', error);
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [user, city]);

  return { favorites, loading };
};
