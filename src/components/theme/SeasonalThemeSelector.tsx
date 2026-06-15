import React, { memo } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const themeOptions = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'system', label: 'Auto', icon: Monitor },
] as const;

const SeasonalThemeSelector = memo(() => {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted/80 backdrop-blur-sm transition-all duration-300 hover:scale-105">
          {theme === 'dark' ? (
            <Moon className="h-[18px] w-[18px] text-foreground/70" strokeWidth={1.5} />
          ) : (
            <Sun className="h-[18px] w-[18px] text-foreground/70" strokeWidth={1.5} />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 p-0 overflow-hidden rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl shadow-xl z-[200] animate-in fade-in-0 slide-in-from-top-2 duration-200"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/50">
          <div className="p-2 rounded-xl bg-primary/10">
            <Palette className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Apparence</h3>
            <p className="text-[11px] text-muted-foreground">Personnalisez votre expérience</p>
          </div>
        </div>

        {/* Clair / Sombre / Auto */}
        <div className="p-3">
          <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg",
                    "transition-all duration-300 text-xs font-medium",
                    isActive
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

SeasonalThemeSelector.displayName = 'SeasonalThemeSelector';

export { SeasonalThemeSelector };
