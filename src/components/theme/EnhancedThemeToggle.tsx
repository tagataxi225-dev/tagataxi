import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedThemeToggleProps {
  variant?: 'icon' | 'full';
  size?: 'sm' | 'lg' | 'default';
  className?: string;
}

export const EnhancedThemeToggle = ({ 
  variant = 'icon', 
  size = 'default', 
  className = '' 
}: EnhancedThemeToggleProps) => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size={size}
        className={`transition-all duration-300 ${className}`}
        disabled
      >
        <Monitor className="h-4 w-4" />
      </Button>
    );
  }

  const currentTheme = resolvedTheme || theme;
  
  const getThemeIcon = (themeName: string) => {
    switch (themeName) {
      case 'light':
        return <Sun className="h-4 w-4 text-congo-yellow transition-colors" />;
      case 'dark':
        return <Moon className="h-4 w-4 text-congo-blue transition-colors" />;
      default:
        return <Monitor className="h-4 w-4 text-muted-foreground transition-colors" />;
    }
  };

  const getThemeLabel = (themeName: string) => {
    switch (themeName) {
      case 'light':
        return 'Mode clair';
      case 'dark':
        return 'Mode sombre';
      case 'system':
        return 'Automatique';
      default:
        return 'Thème';
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  if (variant === 'full') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={size}
            className={`transition-all duration-300 hover:scale-105 glassmorphism ${className}`}
          >
            <motion.div
              key={currentTheme}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              {getThemeIcon(currentTheme)}
              <span className="hidden sm:inline">{getThemeLabel(theme)}</span>
            </motion.div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="glassmorphism">
          <AnimatePresence>
            {['light', 'dark', 'system'].map((themeName) => (
              <motion.div
                key={themeName}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <DropdownMenuItem
                  onClick={() => handleThemeChange(themeName)}
                  className={`flex items-center gap-2 cursor-pointer transition-all duration-200 ${
                    theme === themeName ? 'bg-accent text-accent-foreground' : ''
                  }`}
                >
                  {getThemeIcon(themeName)}
                  <span>{getThemeLabel(themeName)}</span>
                  {theme === themeName && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto h-2 w-2 rounded-full bg-primary"
                    />
                  )}
                </DropdownMenuItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className={`transition-all duration-300 hover:scale-110 hover:bg-accent/20 ${className}`}
        >
          <motion.div
            key={currentTheme}
            initial={{ scale: 0.5, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              duration: 0.3,
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
          >
            {getThemeIcon(currentTheme)}
          </motion.div>
          <span className="sr-only">Changer le thème</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="glassmorphism">
        <AnimatePresence>
          {['light', 'dark', 'system'].map((themeName, index) => (
            <motion.div
              key={themeName}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ 
                duration: 0.2,
                delay: index * 0.05
              }}
            >
              <DropdownMenuItem
                onClick={() => handleThemeChange(themeName)}
                className={`flex items-center gap-3 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  theme === themeName ? 'bg-accent text-accent-foreground shadow-md' : ''
                }`}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {getThemeIcon(themeName)}
                </motion.div>
                <span className="font-medium">{getThemeLabel(themeName)}</span>
                {theme === themeName && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="ml-auto"
                  >
                    <Palette className="h-3 w-3 text-primary" />
                  </motion.div>
                )}
              </DropdownMenuItem>
            </motion.div>
          ))}
        </AnimatePresence>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};