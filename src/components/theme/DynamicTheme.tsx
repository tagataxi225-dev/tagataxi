import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import SnowfallEffect from './SnowfallEffect';
import { SeasonalThemeProvider } from '@/contexts/SeasonalThemeContext';

interface DynamicThemeProps {
  children: React.ReactNode;
}

type ThemeMode = 'day' | 'sunset' | 'night';

const DynamicTheme: React.FC<DynamicThemeProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('day');
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const updateTheme = () => {
      const hour = new Date().getHours();
      
      let newMode: ThemeMode;
      if (hour >= 6 && hour < 17) {
        newMode = 'day';
      } else if (hour >= 17 && hour < 20) {
        newMode = 'sunset';
      } else {
        newMode = 'night';
      }

      if (newMode !== themeMode) {
        setThemeMode(newMode);
      }
    };

    // Update immediately
    updateTheme();

    // Update every hour
    const interval = setInterval(updateTheme, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [themeMode]);

  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    const currentTheme = resolvedTheme || theme;
    const isDark = currentTheme === 'dark';
    
    // Add theme-mode class for CSS-based styling instead of direct manipulation
    root.className = root.className.replace(/\btheme-mode-\w+\b/g, '');
    root.classList.add(`theme-mode-${themeMode}`);
    
    // Only apply essential tweaks that work with CSS system
    if (themeMode === 'sunset') {
      root.style.setProperty('--temporal-accent', isDark ? '35 25% 8%' : '35 25% 96%');
    } else if (themeMode === 'night') {
      root.style.setProperty('--temporal-accent', isDark ? '220 35% 6%' : '220 15% 92%');
    } else {
      root.style.removeProperty('--temporal-accent');
    }
  }, [themeMode, resolvedTheme, theme, mounted]);

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return <div className="relative">{children}</div>;
  }

  return (
    <SeasonalThemeProvider>
      <div className="relative">
        {children}
        
        {/* Effets saisonniers (flocons de neige pour Noël) */}
        <SnowfallEffect />
        
        {/* Congo-inspired ambient overlay with improved theme awareness */}
        <div 
          className={`fixed inset-0 pointer-events-none z-0 transition-all duration-1000 congo-ambient-overlay theme-${resolvedTheme || theme} mode-${themeMode}`}
        />
      </div>
    </SeasonalThemeProvider>
  );
};

export default DynamicTheme;