import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Palette, Monitor, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DigitalTemplateFieldsProps {
  specs: {
    compatible_software?: string[];
    resolution?: string;
    formats_included?: string[];
  };
  onChange: (specs: any) => void;
}

const SOFTWARES = [
  { id: 'photoshop', label: 'Photoshop', color: 'bg-blue-100 text-blue-700' },
  { id: 'figma', label: 'Figma', color: 'bg-purple-100 text-purple-700' },
  { id: 'canva', label: 'Canva', color: 'bg-cyan-100 text-cyan-700' },
  { id: 'illustrator', label: 'Illustrator', color: 'bg-orange-100 text-orange-700' },
  { id: 'sketch', label: 'Sketch', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'xd', label: 'Adobe XD', color: 'bg-pink-100 text-pink-700' },
  { id: 'powerpoint', label: 'PowerPoint', color: 'bg-red-100 text-red-700' },
  { id: 'word', label: 'Word', color: 'bg-blue-100 text-blue-700' },
];

const FILE_FORMATS = [
  { id: 'psd', label: 'PSD' },
  { id: 'ai', label: 'AI' },
  { id: 'fig', label: 'FIG' },
  { id: 'png', label: 'PNG' },
  { id: 'svg', label: 'SVG' },
  { id: 'eps', label: 'EPS' },
  { id: 'pdf', label: 'PDF' },
];

export const DigitalTemplateFields: React.FC<DigitalTemplateFieldsProps> = ({ specs, onChange }) => {
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
    <Card className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-950/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="h-5 w-5 text-indigo-600" />
          <span className="font-semibold text-indigo-700 dark:text-indigo-300">Détails du template</span>
        </div>

        {/* Logiciels compatibles */}
        <div>
          <Label className="flex items-center gap-2 text-sm mb-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            Logiciels compatibles *
          </Label>
          <div className="flex flex-wrap gap-2">
            {SOFTWARES.map((sw) => {
              const isSelected = (specs.compatible_software || []).includes(sw.id);
              return (
                <Badge
                  key={sw.id}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all px-3 py-1.5 text-sm",
                    isSelected
                      ? sw.color + " border-2 font-semibold dark:bg-opacity-30"
                      : "hover:bg-muted"
                  )}
                  onClick={() => toggleItem('compatible_software', sw.id)}
                >
                  {isSelected && "✓ "}{sw.label}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Résolution */}
        <div>
          <Label className="flex items-center gap-2 text-sm">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            Résolution / Dimensions
          </Label>
          <Input
            placeholder="Ex: 1920x1080, A4, 4K..."
            value={specs.resolution || ''}
            onChange={(e) => updateSpec('resolution', e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Formats de fichiers */}
        <div>
          <Label className="flex items-center gap-2 text-sm mb-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            Formats de fichiers inclus
          </Label>
          <div className="flex flex-wrap gap-2">
            {FILE_FORMATS.map((format) => {
              const isSelected = (specs.formats_included || []).includes(format.id);
              return (
                <Badge
                  key={format.id}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all px-3 py-1.5 text-sm",
                    isSelected
                      ? "bg-indigo-100 text-indigo-700 border-2 font-semibold dark:bg-indigo-900/30 dark:text-indigo-300"
                      : "hover:bg-muted"
                  )}
                  onClick={() => toggleItem('formats_included', format.id)}
                >
                  {isSelected && "✓ "}{format.label}
                </Badge>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
