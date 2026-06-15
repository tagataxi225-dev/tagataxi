import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Shield, FileType } from 'lucide-react';

interface DigitalOtherFieldsProps {
  specs: {
    file_format?: string;
    license_type?: string;
    additional_info?: string;
  };
  onChange: (specs: any) => void;
}

export const DigitalOtherFields: React.FC<DigitalOtherFieldsProps> = ({ specs, onChange }) => {
  const updateSpec = (key: string, value: any) => {
    onChange({ ...specs, [key]: value });
  };

  return (
    <Card className="border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50/50 to-transparent dark:from-gray-950/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-5 w-5 text-gray-600" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">Détails du produit</span>
        </div>

        {/* Format + Licence */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2 text-sm">
              <FileType className="h-4 w-4 text-muted-foreground" />
              Format de fichier
            </Label>
            <Input
              placeholder="Ex: ZIP, RAR..."
              value={specs.file_format || ''}
              onChange={(e) => updateSpec('file_format', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Type de licence
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
                <SelectItem value="unlimited">🌐 Illimité</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div>
          <Label className="text-sm">Informations supplémentaires</Label>
          <Input
            placeholder="Ajoutez des détails sur votre produit..."
            value={specs.additional_info || ''}
            onChange={(e) => updateSpec('additional_info', e.target.value)}
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
};
