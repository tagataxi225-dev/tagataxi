import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { toast } from 'sonner';

export const ThemeNotification = () => {
  const [previousTheme, setPreviousTheme] = useState<string | undefined>();
  
  // Safe theme access
  let theme = 'dark', systemTheme = 'dark';
  try {
    const themeData = useTheme();
    theme = themeData.theme || 'dark';
    systemTheme = themeData.systemTheme || 'dark';
  } catch (error) {
    // Skip notifications if theme context is not available
    return null;
  }

  useEffect(() => {
    if (previousTheme && theme !== previousTheme) {
      const resolvedTheme = theme === 'system' ? systemTheme : theme;
      const icons = {
        light: '☀️',
        dark: '🌙',
        system: '🖥️'
      };

      const messages = {
        light: 'Mode clair activé',
        dark: 'Mode sombre activé',
        system: 'Mode automatique activé'
      };

      toast.success(messages[theme as keyof typeof messages] || 'Thème changé', {
        icon: icons[theme as keyof typeof icons],
        duration: 2000,
        className: 'glassmorphism',
      });
    }
    setPreviousTheme(theme);
  }, [theme, systemTheme, previousTheme]);

  return null;
};