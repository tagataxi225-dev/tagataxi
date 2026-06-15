/**
 * 🚀 Hooks React Query optimisés avec configuration de cache adaptée
 * 
 * Utilisation :
 * - useStaticDataQuery : Données statiques (produits, restaurants) - 10min cache
 * - useDynamicDataQuery : Données dynamiques (commandes, livraisons) - 1min cache
 * - useRealtimeDataQuery : Données temps réel (position chauffeur) - 10s cache
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';

/**
 * Pour données STATIQUES (rarement modifiées)
 * Ex: Produits marketplace, restaurants, types de véhicules
 * 
 * staleTime: 10 minutes
 * gcTime: 30 minutes
 */
export const useStaticDataQuery = <TData = unknown, TError = Error>(
  options: Omit<UseQueryOptions<TData, TError>, 'staleTime' | 'gcTime'>
) => {
  return useQuery<TData, TError>({
    ...options,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false, // Pas de refetch au focus
    refetchOnMount: false, // Utiliser le cache si disponible
  } as UseQueryOptions<TData, TError>);
};

/**
 * Pour données DYNAMIQUES (mises à jour fréquentes)
 * Ex: Commandes, livraisons, stats dashboard
 * 
 * staleTime: 1 minute
 * gcTime: 5 minutes
 */
export const useDynamicDataQuery = <TData = unknown, TError = Error>(
  options: Omit<UseQueryOptions<TData, TError>, 'staleTime' | 'gcTime'>
) => {
  return useQuery<TData, TError>({
    ...options,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  } as UseQueryOptions<TData, TError>);
};

/**
 * Pour données TEMPS RÉEL (besoin d'actualisation rapide)
 * Ex: Position chauffeur, statut commande en cours
 * 
 * staleTime: 10 secondes
 * gcTime: 30 secondes
 */
export const useRealtimeDataQuery = <TData = unknown, TError = Error>(
  options: Omit<UseQueryOptions<TData, TError>, 'staleTime' | 'gcTime'>
) => {
  return useQuery<TData, TError>({
    ...options,
    staleTime: 10 * 1000, // 10 secondes
    gcTime: 30 * 1000, // 30 secondes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  } as UseQueryOptions<TData, TError>);
};

/**
 * Pour données UTILISATEUR (documents, profil)
 * Ex: Documents chauffeur, profil utilisateur
 * 
 * staleTime: 5 minutes
 * gcTime: 15 minutes
 */
export const useUserDataQuery = <TData = unknown, TError = Error>(
  options: Omit<UseQueryOptions<TData, TError>, 'staleTime' | 'gcTime'>
) => {
  return useQuery<TData, TError>({
    ...options,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  } as UseQueryOptions<TData, TError>);
};

/**
 * Pour données ANALYTICS (rapports, statistiques)
 * Ex: Analytics partenaire, statistiques admin
 * 
 * staleTime: 3 minutes
 * gcTime: 10 minutes
 */
export const useAnalyticsDataQuery = <TData = unknown, TError = Error>(
  options: Omit<UseQueryOptions<TData, TError>, 'staleTime' | 'gcTime'>
) => {
  return useQuery<TData, TError>({
    ...options,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  } as UseQueryOptions<TData, TError>);
};
