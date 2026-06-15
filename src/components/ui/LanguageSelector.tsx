import React from 'react';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
  { code: 'ln' as Language, name: 'Lingala', flag: '🇨🇩' },
  { code: 'kg' as Language, name: 'Kikongo', flag: '🇨🇩' },
  { code: 'lua' as Language, name: 'Tshiluba', flag: '🇨🇩' },
  { code: 'sw' as Language, name: 'Kiswahili', flag: '🇹🇿' },
];

export const LanguageSelector = () => {
  const { language, setLanguage, t } = useLanguage();
  
  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="h-9 gap-2 bg-background border-border hover:bg-accent"
        >
          <Globe className="h-4 w-4" />
          <span className="text-sm">{currentLanguage?.flag}</span>
          <span className="hidden sm:inline text-sm font-medium">
            {currentLanguage?.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-background border-border shadow-lg"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent ${
              language === lang.code ? 'bg-accent/50' : ''
            }`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="font-medium">{lang.name}</span>
            {language === lang.code && (
              <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};