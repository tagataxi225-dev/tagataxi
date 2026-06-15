import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Code, Monitor, Shield, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DigitalSoftwareFieldsProps {
  specs: {
    platforms?: string[];
    version?: string;
    license_type?: string;
    requirements?: string;
  };
  onChange: (specs: any) => void;
}

const PLATFORMS = [
  { id: 'windows', label: '🪟 Windows' },
  { id: 'mac', label: '🍎 macOS' },
  { id: 'linux', label: '🐧 Linux' },
  { id: 'web', label: '🌐 Web' },
  { id: 'android', label: '🤖 Android' },
  { id: 'ios', label: '📱 iOS' },
];

export const DigitalSoftwareFields: React.FC<DigitalSoftwareFieldsProps> = ({ specs, onChange }) => {
  const updateSpec = (key: string, value: any) => {
    onChange({ ...specs, [key]: value });
  };

  const togglePlatform = (platformId: string) => {
    const current = specs.platforms || [];
    const newPlatforms = current.includes(platformId)
      ? current.filter(p => p !== platformId)
      : [...current, platformId];
    updateSpec('platforms', newPlatforms);
  };

  return (
    <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Code className="h-5 w-5 text-emerald-600" />
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">Détails du logiciel</span>
        </div>

        {/* Plateformes */}
        <div>
          <Label className="flex items-center gap-2 text-sm mb-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            Plateformes compatibles *
          </Label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((platform) => {
              const isSelected = (specs.platforms || []).includes(platform.id);
              return (
                <Badge
                  key={platform.id}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all px-3 py-1.5 text-sm",
                    isSelected
                      ? "bg-emerald-100 text-emerald-700 border-2 font-semibold dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "hover:bg-muted"
                  )}
                  onClick={() => togglePlatform(platform.id)}
                >
                  {platform.label}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Version + Licence */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-muted-foreground" />
              Version
            </Label>
            <Input
              placeholder="Ex: 2.1.0"
              value={specs.version || ''}
              onChange={(e) => updateSpec('version', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Type de licence *
            </Label>
            <Select
              value={specs.license_type || ''}
              onValueChange={(v) => updateSpec('license_type', v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lifetime">♾️ À vie (one-time)</SelectItem>
                <SelectItem value="yearly">📅 Annuel</SelectItem>
                <SelectItem value="monthly">📆 Mensuel</SelectItem>
                <SelectItem value="single_user">👤 Utilisateur unique</SelectItem>
                <SelectItem value="multi_user">👥 Multi-utilisateurs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Prérequis */}
        <div>
          <Label className="text-sm">Configuration requise (optionnel)</Label>
          <Input
            placeholder="Ex: Windows 10+, 4GB RAM..."
            value={specs.requirements || ''}
            onChange={(e) => updateSpec('requirements', e.target.value)}
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
};
