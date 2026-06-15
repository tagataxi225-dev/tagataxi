import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sliders, Monitor, Tag, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DigitalPresetFieldsProps {
  specs: {
    compatible_software?: string[];
    version?: string;
    preset_count?: number;
    formats_included?: string[];
  };
  onChange: (specs: any) => void;
}

const COMPATIBLE_APPS = [
  { id: 'lightroom', label: 'Lightroom' },
  { id: 'photoshop', label: 'Photoshop' },
  { id: 'premiere', label: 'Premiere Pro' },
  { id: 'aftereffects', label: 'After Effects' },
  { id: 'davinci', label: 'DaVinci Resolve' },
  { id: 'finalcut', label: 'Final Cut Pro' },
  { id: 'ableton', label: 'Ableton Live' },
  { id: 'flstudio', label: 'FL Studio' },
  { id: 'logic', label: 'Logic Pro' },
];

const FILE_FORMATS = ['XMP', 'DNG', 'LUT', 'CUBE', 'VST', 'AU', 'MOGRT', 'AEP'];

export const DigitalPresetFields: React.FC<DigitalPresetFieldsProps> = ({ specs, onChange }) => {
  const updateSpec = (key: string, value: any) => {
    onChange({ ...specs, [key]: value });
  };

  const toggleItem = (key: 'compatible_software' | 'formats_included', itemId: string) => {
    const current = specs[key] || [];
    const newItems = current.includes(itemId)
      ? current.filter((f: string) => f !== itemId)
      : [...current, itemId];
    updateSpec(key, newItems);
  };

  return (
    <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/50 to-transparent dark:from-violet-950/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="h-5 w-5 text-violet-600" />
          <span className="font-semibold text-violet-700 dark:text-violet-300">Détails des presets</span>
        </div>

        {/* Applications compatibles */}
        <div>
          <Label className="flex items-center gap-2 text-sm mb-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            Applications compatibles *
          </Label>
          <div className="flex flex-wrap gap-2">
            {COMPATIBLE_APPS.map((app) => {
              const isSelected = (specs.compatible_software || []).includes(app.id);
              return (
                <Badge
                  key={app.id}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all px-3 py-1.5 text-sm",
                    isSelected
                      ? "bg-violet-100 text-violet-700 border-2 font-semibold dark:bg-violet-900/30 dark:text-violet-300"
                      : "hover:bg-muted"
                  )}
                  onClick={() => toggleItem('compatible_software', app.id)}
                >
                  {isSelected && "✓ "}{app.label}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Version + Quantité */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-muted-foreground" />
              Version requise
            </Label>
            <Input
              placeholder="Ex: CC 2023+"
              value={specs.version || ''}
              onChange={(e) => updateSpec('version', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground" />
              Nombre de presets
            </Label>
            <Input
              type="number"
              placeholder="Ex: 25"
              min={1}
              value={specs.preset_count || ''}
              onChange={(e) => updateSpec('preset_count', parseInt(e.target.value) || undefined)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Formats */}
        <div>
          <Label className="text-sm mb-2 block">Types de fichiers inclus</Label>
          <div className="flex flex-wrap gap-2">
            {FILE_FORMATS.map((format) => {
              const isSelected = (specs.formats_included || []).includes(format);
              return (
                <Badge
                  key={format}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all px-3 py-1.5 text-sm",
                    isSelected
                      ? "bg-violet-100 text-violet-700 border-2 font-semibold dark:bg-violet-900/30 dark:text-violet-300"
                      : "hover:bg-muted"
                  )}
                  onClick={() => toggleItem('formats_included', format)}
                >
                  {isSelected && "✓ "}{format}
                </Badge>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
