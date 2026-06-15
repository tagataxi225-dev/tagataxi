import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Globe, 
  Volume2, 
  Eye, 
  Accessibility, 
  Smartphone,
  Wifi,
  Battery,
  Sun,
  Moon
} from 'lucide-react';

interface AccessibilitySettings {
  largeText: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  voiceNavigation: boolean;
}

interface PerformanceSettings {
  dataCompression: boolean;
  imageOptimization: boolean;
  offlineMode: boolean;
  lowBandwidthMode: boolean;
  batteryOptimization: boolean;
}

const SimplifiedInterface: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const [theme, setLocalTheme] = useState<'light' | 'dark'>('light');
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    largeText: false,
    highContrast: false,
    reducedMotion: false,
    screenReader: false,
    voiceNavigation: false
  });
  const [performance, setPerformance] = useState<PerformanceSettings>({
    dataCompression: true,
    imageOptimization: true,
    offlineMode: true,
    lowBandwidthMode: false,
    batteryOptimization: true
  });

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ln', name: 'Lingala', flag: '🇨🇩' },
    { code: 'kg', name: 'Kikongo', flag: '🇨🇩' },
    { code: 'lua', name: 'Tshiluba', flag: '🇨🇩' },
    { code: 'sw', name: 'Swahili', flag: '🇹🇿' }
  ];

  const toggleAccessibility = (key: keyof AccessibilitySettings) => {
    setAccessibility(prev => ({ ...prev, [key]: !prev[key] }));
    
    // Apply changes to DOM
    if (key === 'largeText') {
      document.documentElement.style.fontSize = accessibility.largeText ? '16px' : '18px';
    }
    if (key === 'highContrast') {
      document.documentElement.classList.toggle('high-contrast', !accessibility.highContrast);
    }
  };

  const togglePerformance = (key: keyof PerformanceSettings) => {
    setPerformance(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setLocalTheme(newTheme);
    // Theme is managed by next-themes ThemeProvider globally
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Interface Simplifiée</h2>
        <p className="text-muted-foreground">
          Adaptée pour tous les niveaux d'utilisateurs
        </p>
      </div>

      {/* Language Selection */}
      <Card className="cultural-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Langue / Lokóta</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                variant={language === lang.code ? 'default' : 'outline'}
                onClick={() => setLanguage(lang.code as any)}
                className="justify-start touch-friendly h-14"
              >
                <span className="text-2xl mr-3">{lang.flag}</span>
                <div className="text-left">
                  <p className="font-medium">{lang.name}</p>
                  {lang.code === 'ln' && (
                    <p className="text-xs text-muted-foreground">Lokóta ya mbóka</p>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Theme Selection */}
      <Card className="cultural-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span>Apparence</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-3">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setLocalTheme('light')}
              className="flex-1 touch-friendly"
            >
              <Sun className="h-4 w-4 mr-2" />
              Clair
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setLocalTheme('dark')}
              className="flex-1 touch-friendly"
            >
              <Moon className="h-4 w-4 mr-2" />
              Sombre
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Settings */}
      <Card className="cultural-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Accessibility className="h-5 w-5" />
            <span>Accessibilité</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { 
              key: 'largeText', 
              label: 'Texte agrandi', 
              description: 'Augmente la taille du texte',
              icon: <Eye className="h-4 w-4" />
            },
            { 
              key: 'highContrast', 
              label: 'Contraste élevé', 
              description: 'Améliore la lisibilité',
              icon: <Eye className="h-4 w-4" />
            },
            { 
              key: 'voiceNavigation', 
              label: 'Navigation vocale', 
              description: 'Commandes par la voix',
              icon: <Volume2 className="h-4 w-4" />
            }
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center space-x-3">
                {setting.icon}
                <div>
                  <p className="font-medium">{setting.label}</p>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                </div>
              </div>
              <Button
                variant={accessibility[setting.key as keyof AccessibilitySettings] ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleAccessibility(setting.key as keyof AccessibilitySettings)}
                className="touch-friendly"
              >
                {accessibility[setting.key as keyof AccessibilitySettings] ? 'Activé' : 'Désactivé'}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Performance Optimization */}
      <Card className="cultural-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5" />
            <span>Optimisation Congo</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { 
              key: 'lowBandwidthMode', 
              label: 'Mode connexion lente', 
              description: 'Optimise pour EDGE/2G',
              icon: <Wifi className="h-4 w-4" />
            },
            { 
              key: 'dataCompression', 
              label: 'Compression données', 
              description: 'Réduit la consommation',
              icon: <Smartphone className="h-4 w-4" />
            },
            { 
              key: 'batteryOptimization', 
              label: 'Économie batterie', 
              description: 'Prolonge l\'autonomie',
              icon: <Battery className="h-4 w-4" />
            }
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center space-x-3">
                {setting.icon}
                <div>
                  <p className="font-medium">{setting.label}</p>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                </div>
              </div>
              <Button
                variant={performance[setting.key as keyof PerformanceSettings] ? 'default' : 'outline'}
                size="sm"
                onClick={() => togglePerformance(setting.key as keyof PerformanceSettings)}
                className="touch-friendly"
              >
                {performance[setting.key as keyof PerformanceSettings] ? 'ON' : 'OFF'}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Congo-specific Settings */}
      <Card className="bg-gradient-congo text-white">
        <CardHeader>
          <CardTitle>Paramètres Congo RDC</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Devise principale</span>
              <Badge variant="secondary" className="bg-white text-primary">
                Franc Congolais (CDF)
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Fuseau horaire</span>
              <Badge variant="secondary" className="bg-white text-primary">
                UTC+1 (Kinshasa)
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Format des adresses</span>
              <Badge variant="secondary" className="bg-white text-primary">
                Congo RDC
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-3">
        <Button className="touch-friendly bg-primary text-white h-16 text-lg">
          🚗 Nouvelle Course
        </Button>
        <Button variant="outline" className="touch-friendly h-16 text-lg">
          📦 Livraison Express
        </Button>
        <Button variant="outline" className="touch-friendly h-16 text-lg">
          🛒 Marketplace Local
        </Button>
      </div>
    </div>
  );
};

export default SimplifiedInterface;