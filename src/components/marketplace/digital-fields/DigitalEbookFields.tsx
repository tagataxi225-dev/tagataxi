import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, FileText, Languages, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DigitalEbookFieldsProps {
  specs: {
    pages?: number;
    formats_included?: string[];
    language?: string;
    author?: string;
  };
  onChange: (specs: any) => void;
}

const EBOOK_FORMATS = [
  { id: 'pdf', label: 'PDF', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  { id: 'epub', label: 'EPUB', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { id: 'mobi', label: 'MOBI', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { id: 'docx', label: 'DOCX', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
];

export const DigitalEbookFields: React.FC<DigitalEbookFieldsProps> = ({ specs, onChange }) => {
  const updateSpec = (key: string, value: any) => {
    onChange({ ...specs, [key]: value });
  };

  const toggleFormat = (formatId: string) => {
    const current = specs.formats_included || [];
    const newFormats = current.includes(formatId)
      ? current.filter(f => f !== formatId)
      : [...current, formatId];
    updateSpec('formats_included', newFormats);
  };

  return (
    <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-5 w-5 text-red-600" />
          <span className="font-semibold text-red-700 dark:text-red-300">Détails de l'e-book</span>
        </div>

        {/* Pages + Langue */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground" />
              Nombre de pages
            </Label>
            <Input
              type="number"
              placeholder="Ex: 150"
              min={1}
              value={specs.pages || ''}
              onChange={(e) => updateSpec('pages', parseInt(e.target.value) || undefined)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2 text-sm">
              <Languages className="h-4 w-4 text-muted-foreground" />
              Langue *
            </Label>
            <Select
              value={specs.language || ''}
              onValueChange={(v) => updateSpec('language', v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">🇫🇷 Français</SelectItem>
                <SelectItem value="en">🇬🇧 Anglais</SelectItem>
                <SelectItem value="lingala">🇨🇩 Lingala</SelectItem>
                <SelectItem value="other">🌍 Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Auteur */}
        <div>
          <Label className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Auteur (optionnel)
          </Label>
          <Input
            placeholder="Nom de l'auteur"
            value={specs.author || ''}
            onChange={(e) => updateSpec('author', e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Formats inclus */}
        <div>
          <Label className="text-sm mb-2 block">Format(s) inclus dans le téléchargement</Label>
          <div className="flex flex-wrap gap-2">
            {EBOOK_FORMATS.map((format) => {
              const isSelected = (specs.formats_included || []).includes(format.id);
              return (
                <Badge
                  key={format.id}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all px-3 py-1.5 text-sm",
                    isSelected
                      ? format.color + " border-2 font-semibold"
                      : "hover:bg-muted"
                  )}
                  onClick={() => toggleFormat(format.id)}
                >
                  {isSelected && "✓ "}{format.label}
                </Badge>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Sélectionnez les formats inclus dans l'achat
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
