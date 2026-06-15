import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Hash, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DigitalDocumentFieldsProps {
  specs: {
    pages?: number;
    language?: string;
    formats_included?: string[];
    document_type?: string;
  };
  onChange: (specs: any) => void;
}

const DOC_FORMATS = ['PDF', 'DOCX', 'XLSX', 'PPTX', 'TXT', 'ODT'];

export const DigitalDocumentFields: React.FC<DigitalDocumentFieldsProps> = ({ specs, onChange }) => {
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
    <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-950/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-5 w-5 text-slate-600" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">Détails du document</span>
        </div>

        {/* Type + Pages */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">Type de document</Label>
            <Select
              value={specs.document_type || ''}
              onValueChange={(v) => updateSpec('document_type', v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="template">📋 Modèle/Template</SelectItem>
                <SelectItem value="contract">📄 Contrat</SelectItem>
                <SelectItem value="guide">📚 Guide</SelectItem>
                <SelectItem value="checklist">✅ Checklist</SelectItem>
                <SelectItem value="spreadsheet">📊 Tableur</SelectItem>
                <SelectItem value="presentation">📽️ Présentation</SelectItem>
                <SelectItem value="other">📁 Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground" />
              Nombre de pages
            </Label>
            <Input
              type="number"
              placeholder="Ex: 25"
              min={1}
              value={specs.pages || ''}
              onChange={(e) => updateSpec('pages', parseInt(e.target.value) || undefined)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Langue */}
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

        {/* Formats */}
        <div>
          <Label className="text-sm mb-2 block">Formats de fichiers inclus</Label>
          <div className="flex flex-wrap gap-2">
            {DOC_FORMATS.map((format) => {
              const isSelected = (specs.formats_included || []).includes(format);
              return (
                <Badge
                  key={format}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all px-3 py-1.5 text-sm",
                    isSelected
                      ? "bg-slate-200 text-slate-700 border-2 font-semibold dark:bg-slate-800 dark:text-slate-300"
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
