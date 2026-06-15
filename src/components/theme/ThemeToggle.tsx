import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'icon' | 'full';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'icon', 
  size = 'md',
  className 
}) => {
  const { theme, setTheme } = useTheme();

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const buttonSizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className={cn(iconSizes[size], 'text-congo-yellow animate-scale-fade')} />;
      case 'dark':
        return <Moon className={cn(iconSizes[size], 'text-congo-blue animate-scale-fade')} />;
      default:
        return <Monitor className={cn(iconSizes[size], 'text-foreground animate-scale-fade')} />;
    }
  };

  if (variant === 'full') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className={cn(
              'px-4 py-2 h-auto gap-2 hover:bg-accent/50 transition-all duration-200',
              className
            )}
          >
            {getThemeIcon()}
            <span className="text-sm font-medium">
              {theme === 'light' ? 'Clair' : theme === 'dark' ? 'Sombre' : 'Auto'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glassmorphism border-border/50">
          <DropdownMenuItem 
            onClick={() => setTheme('light')}
            className="gap-2 hover:bg-congo-yellow/10 focus:bg-congo-yellow/10 cursor-pointer"
          >
            <Sun className="h-4 w-4 text-congo-yellow" />
            <span>Mode clair</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme('dark')}
            className="gap-2 hover:bg-congo-blue/10 focus:bg-congo-blue/10 cursor-pointer"
          >
            <Moon className="h-4 w-4 text-congo-blue" />
            <span>Mode sombre</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme('system')}
            className="gap-2 hover:bg-accent/10 focus:bg-accent/10 cursor-pointer"
          >
            <Monitor className="h-4 w-4" />
            <span>Automatique</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            buttonSizes[size],
            'hover:bg-accent/50 transition-all duration-200 hover:scale-105 active:scale-95',
            className
          )}
        >
          {getThemeIcon()}
          <span className="sr-only">Basculer le thème</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glassmorphism border-border/50">
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className="gap-2 hover:bg-congo-yellow/10 focus:bg-congo-yellow/10 cursor-pointer"
        >
          <Sun className="h-4 w-4 text-congo-yellow" />
          <span>Mode clair</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className="gap-2 hover:bg-congo-blue/10 focus:bg-congo-blue/10 cursor-pointer"
        >
          <Moon className="h-4 w-4 text-congo-blue" />
          <span>Mode sombre</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className="gap-2 hover:bg-accent/10 focus:bg-accent/10 cursor-pointer"
        >
          <Monitor className="h-4 w-4" />
          <span>Automatique</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};