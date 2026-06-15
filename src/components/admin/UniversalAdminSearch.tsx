import React from 'react';
import { UniversalSearchInterface } from '@/components/search/UniversalSearchInterface';
import { useUniversalSearch } from '@/hooks/useUniversalSearch';
// Removed searchProviders dependency - using simplified search
import type { SearchResult } from '@/components/search/UniversalSearchInterface';

interface UniversalAdminSearchProps {
  onResultSelect: (result: SearchResult) => void;
  searchType?: 'universal' | 'users' | 'orders';
  className?: string;
}

export const UniversalAdminSearch = ({
  onResultSelect,
  searchType = 'universal',
  className
}: UniversalAdminSearchProps) => {
  
  const getSearchConfig = () => {
    switch (searchType) {
      case 'users':
        return {
          type: 'user' as const,
          placeholder: "Rechercher un utilisateur (nom, email, téléphone)...",
          minCharacters: 2,
          maxResults: 10,
          debounceMs: 200,
          enableVoiceSearch: true,
          showPopularSuggestions: false,
          showRecentSearches: true
        };
      
      case 'orders':
        return {
          type: 'general' as const,
          placeholder: "Rechercher une commande (ID, adresse, client)...",
          minCharacters: 2,
          maxResults: 15,
          debounceMs: 200,
          enableVoiceSearch: true,
          showPopularSuggestions: false,
          showRecentSearches: true
        };
      
      default:
        return {
          type: 'general' as const,
          placeholder: "Recherche universelle (utilisateurs, commandes, lieux...)...",
          minCharacters: 2,
          maxResults: 12,
          debounceMs: 200,
          enableVoiceSearch: true,
          showPopularSuggestions: true,
          showRecentSearches: true
        };
    }
  };

  const getSearchProvider = () => {
    // Simplified search provider - return null to use default
    return null;
  };

  const searchConfig = getSearchConfig();
  
  const {
    searchHistory,
    popularSuggestions,
    saveToHistory
  } = useUniversalSearch({
    config: searchConfig,
    customSearchProvider: getSearchProvider()
  });

  const handleSearchResult = (result: SearchResult) => {
    saveToHistory(result);
    onResultSelect(result);
  };

  const getPopularSuggestionsForType = () => {
    if (searchType === 'universal') {
      return [
        {
          id: 'recent-users',
          type: 'action' as const,
          title: 'Utilisateurs récents',
          subtitle: 'Voir les derniers inscrits',
          badge: { text: 'Utilisateurs', variant: 'default' as const },
          category: 'Admin',
          relevanceScore: 10
        },
        {
          id: 'pending-orders',
          type: 'action' as const,
          title: 'Commandes en attente',
          subtitle: 'Vérifier les commandes non traitées',
          badge: { text: 'Commandes', variant: 'secondary' as const },
          category: 'Admin',
          relevanceScore: 9
        },
        {
          id: 'financial-reports',
          type: 'action' as const,
          title: 'Rapports financiers',
          subtitle: 'Consulter les analyses financières',
          badge: { text: 'Finance', variant: 'outline' as const },
          category: 'Admin',
          relevanceScore: 8
        }
      ];
    }
    return [];
  };

  return (
    <div className={className}>
      <UniversalSearchInterface
        config={searchConfig}
        onSearchResult={handleSearchResult}
        popularSuggestions={popularSuggestions.length > 0 ? popularSuggestions : getPopularSuggestionsForType()}
        recentSearches={searchHistory}
        customSearchProvider={getSearchProvider()}
        className="w-full"
        autoFocus={false}
      />
    </div>
  );
};