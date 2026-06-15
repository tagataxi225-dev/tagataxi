import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export type SeasonalTheme = 'default' | 'christmas' | 'newYear' | 'valentine';

interface SeasonalThemeContextType {
  currentSeason: SeasonalTheme;
  setSeason: (season: SeasonalTheme) => void;
  isAutoMode: boolean;
  setAutoMode: (auto: boolean) => void;
  effectsEnabled: boolean;
  setEffectsEnabled: (enabled: boolean) => void;
  seasonalColors: {
    primary: string;
    accent: string;
    glow: string;
  };
}

const SeasonalThemeContext = createContext<SeasonalThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'kwenda-seasonal-theme';
const AUTO_MODE_KEY = 'kwenda-seasonal-auto';
const EFFECTS_KEY = 'kwenda-seasonal-effects';

// Détection automatique de la saison basée sur la date
const detectSeason = (): SeasonalTheme => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  // Noël: 1 décembre - 6 janvier
  if ((month === 12) || (month === 1 && day <= 6)) {
    return 'christmas';
  }
  
  // Nouvel An: 7-15 janvier
  if (month === 1 && day >= 7 && day <= 15) {
    return 'newYear';
  }
  
  // Saint-Valentin: 7-15 février
  if (month === 2 && day >= 7 && day <= 15) {
    return 'valentine';
  }

  return 'default';
};

// Couleurs par saison
const getSeasonalColors = (season: SeasonalTheme) => {
  switch (season) {
    case 'christmas':
      return {
        primary: '0 84% 50%',      // Rouge Noël
        accent: '142 71% 45%',     // Vert sapin
        glow: '43 96% 56%',        // Or
      };
    case 'newYear':
      return {
        primary: '43 96% 56%',     // Or
        accent: '220 14% 80%',     // Argent
        glow: '280 100% 70%',      // Violet festif
      };
    case 'valentine':
      return {
        primary: '340 82% 52%',    // Rose vif
        accent: '0 84% 60%',       // Rouge passion
        glow: '340 100% 76%',      // Rose clair
      };
    default:
      return {
        primary: '0 84% 50%',      // Congo red par défaut
        accent: '142 71% 45%',
        glow: '35 91% 47%',
      };
  }
};

export const SeasonalThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSeason, setCurrentSeason] = useState<SeasonalTheme>(() => {
    if (typeof window === 'undefined') return 'default';
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as SeasonalTheme) || 'default';
  });

  const [isAutoMode, setIsAutoMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(AUTO_MODE_KEY);
    return stored === null ? true : stored === 'true';
  });

  const [effectsEnabled, setEffectsEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(EFFECTS_KEY);
    return stored === null ? true : stored === 'true';
  });

  // Auto-détection si mode auto activé
  useEffect(() => {
    if (isAutoMode) {
      const detected = detectSeason();
      setCurrentSeason(detected);
      localStorage.setItem(STORAGE_KEY, detected);
    }
  }, [isAutoMode]);

  // Appliquer les classes CSS sur le document
  useEffect(() => {
    const root = document.documentElement;
    
    // Supprimer toutes les classes de saison existantes
    root.classList.remove('season-default', 'season-christmas', 'season-newYear', 'season-valentine');
    
    // Ajouter la nouvelle classe
    root.classList.add(`season-${currentSeason}`);
    
    // Appliquer les variables CSS
    const colors = getSeasonalColors(currentSeason);
    root.style.setProperty('--seasonal-primary', colors.primary);
    root.style.setProperty('--seasonal-accent', colors.accent);
    root.style.setProperty('--seasonal-glow', colors.glow);

    // Classe pour les effets
    if (effectsEnabled && currentSeason !== 'default') {
      root.classList.add('seasonal-effects-enabled');
    } else {
      root.classList.remove('seasonal-effects-enabled');
    }
  }, [currentSeason, effectsEnabled]);

  const setSeason = useCallback((season: SeasonalTheme) => {
    setCurrentSeason(season);
    localStorage.setItem(STORAGE_KEY, season);
    if (season !== detectSeason()) {
      setIsAutoMode(false);
      localStorage.setItem(AUTO_MODE_KEY, 'false');
    }
  }, []);

  const setAutoMode = useCallback((auto: boolean) => {
    setIsAutoMode(auto);
    localStorage.setItem(AUTO_MODE_KEY, String(auto));
    if (auto) {
      const detected = detectSeason();
      setCurrentSeason(detected);
      localStorage.setItem(STORAGE_KEY, detected);
    }
  }, []);

  const handleSetEffectsEnabled = useCallback((enabled: boolean) => {
    setEffectsEnabled(enabled);
    localStorage.setItem(EFFECTS_KEY, String(enabled));
  }, []);

  const seasonalColors = useMemo(() => getSeasonalColors(currentSeason), [currentSeason]);

  const value = useMemo(() => ({
    currentSeason,
    setSeason,
    isAutoMode,
    setAutoMode,
    effectsEnabled,
    setEffectsEnabled: handleSetEffectsEnabled,
    seasonalColors,
  }), [currentSeason, setSeason, isAutoMode, setAutoMode, effectsEnabled, handleSetEffectsEnabled, seasonalColors]);

  return (
    <SeasonalThemeContext.Provider value={value}>
      {children}
    </SeasonalThemeContext.Provider>
  );
};

export const useSeasonalTheme = () => {
  const context = useContext(SeasonalThemeContext);
  if (!context) {
    throw new Error('useSeasonalTheme must be used within a SeasonalThemeProvider');
  }
  return context;
};

// Hook safe pour utilisation optionnelle
export const useSeasonalThemeSafe = () => {
  const context = useContext(SeasonalThemeContext);
  return context || {
    currentSeason: 'default' as SeasonalTheme,
    setSeason: () => {},
    isAutoMode: false,
    setAutoMode: () => {},
    effectsEnabled: false,
    setEffectsEnabled: () => {},
    seasonalColors: getSeasonalColors('default'),
  };
};
