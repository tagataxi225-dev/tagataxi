import React from 'react';
import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'kg', name: 'Kikongo', flag: '🇨🇩' },
  { code: 'lua', name: 'Tshiluba', flag: '🇨🇩' },
  { code: 'sw', name: 'Kiswahili', flag: '🇹🇿' },
] as const;

export const AuthLanguageSelector = () => {
  const { language, setLanguage } = useLanguage();
  
  const currentLang = languages.find(lang => lang.code === language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 sm:h-10 gap-2 bg-white/80 dark:bg-card/80 backdrop-blur-md border-congo-red/20 dark:border-congo-red/30 hover:bg-white dark:hover:bg-card hover:border-congo-red/40 dark:hover:border-congo-red/50 hover:shadow-[0_4px_15px_hsl(var(--congo-red)/0.2)] transition-all duration-300 rounded-xl"
        >
          <Globe className="h-4 w-4" />
          <span className="text-base">{currentLang.flag}</span>
          <span className="hidden sm:inline font-medium">{currentLang.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 bg-white dark:bg-card border-congo-red/10 dark:border-congo-red/20 shadow-[0_8px_30px_hsl(var(--congo-red)/0.15)] rounded-xl backdrop-blur-xl animate-in slide-in-from-top-2 fade-in-0 duration-200"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
              hover:bg-congo-red/10 dark:hover:bg-congo-red/20
              transition-colors duration-200
              ${language === lang.code ? 'bg-congo-red/20 text-congo-red' : ''}
            `}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="flex-1 font-medium">{lang.name}</span>
            {language === lang.code && (
              <Check className="h-4 w-4 text-congo-red" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
