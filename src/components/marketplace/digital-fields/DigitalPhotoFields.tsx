import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Image, Monitor, Shield, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DigitalPhotoFieldsProps {
  specs: {
    resolution?: string;
    formats_included?: string[];
    license_type?: string;
    quantity?: number;
  };
  onChange: (specs: any) => void;
}

const PHOTO_FORMATS = ['JPG', 'PNG', 'RAW', 'TIFF', 'WEBP', 'PSD'];

export const DigitalPhotoFields: React.FC<DigitalPhotoFieldsProps> = ({ specs, onChange }) => {
  const updateSpec = (key: string, value: any) => {
    onChange({ ...specs, [key]: value });
  };

  const toggleFormat = (format: string) => {
    const current = specs.formats_included || [];
    const newFormats = current.includes(format)
      ? current.filter(f => f !== format)
      : [...current, format];
    updateSpec('formats_included', newFormats);
  };

  return (
    <Card className="border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50/50 to-transparent dark:from-teal-950/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Image className="h-5 w-5 text-teal-600" />
          <span className="font-semibold text-teal-700 dark:text-teal-300">Détails des photos</span>
        </div>

        {/* Résolution + Quantité */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2 text-sm">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              Résolution
            </Label>
            <Input
              placeholder="Ex: 4000x3000, 12 MP..."
              value={specs.resolution || ''}
              onChange={(e) => updateSpec('resolution', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground" />
              Nombre de photos
            </Label>
            <Input
              type="number"
              placeholder="Ex: 50"
              min={1}
              value={specs.quantity || ''}
              onChange={(e) => updateSpec('quantity', parseInt(e.target.value) || undefined)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Type de licence */}
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
              <SelectItem value="personal">👤 Usage personnel</SelectItem>
              <SelectItem value="commercial">💼 Usage commercial</SelectItem>
              <SelectItem value="editorial">📰 Éditorial</SelectItem>
              <SelectItem value="extended">🌐 Licence étendue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Formats */}
        <div>
          <Label className="text-sm mb-2 block">Formats de fichiers inclus</Label>
          <div className="flex flex-wrap gap-2">
            {PHOTO_FORMATS.map((format) => {
              const isSelected = (specs.formats_included || []).includes(format);
              return (
                <Badge
                  key={format}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all px-3 py-1.5 text-sm",
                    isSelected
                      ? "bg-teal-100 text-teal-700 border-2 font-semibold dark:bg-teal-900/30 dark:text-teal-300"
                      : "hover:bg-muted"
                  )}
                  onClick={() => toggleFormat(format)}
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
