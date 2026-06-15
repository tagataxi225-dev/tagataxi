import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Clock, BarChart3, Languages, Award, BookOpen } from 'lucide-react';

interface DigitalCourseFieldsProps {
  specs: {
    duration_value?: number;
    duration_unit?: string;
    level?: string;
    modules_count?: number;
    language?: string;
    has_certificate?: boolean;
  };
  onChange: (specs: any) => void;
}

export const DigitalCourseFields: React.FC<DigitalCourseFieldsProps> = ({ specs, onChange }) => {
  const updateSpec = (key: string, value: any) => {
    onChange({ ...specs, [key]: value });
  };

  return (
    <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="h-5 w-5 text-purple-600" />
          <span className="font-semibold text-purple-700 dark:text-purple-300">Détails de la formation</span>
        </div>

        {/* Durée totale */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Durée totale *
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="number"
                placeholder="Ex: 12"
                min={1}
                value={specs.duration_value || ''}
                onChange={(e) => updateSpec('duration_value', parseInt(e.target.value) || undefined)}
                className="flex-1"
              />
              <Select
                value={specs.duration_unit || 'hours'}
                onValueChange={(v) => updateSpec('duration_unit', v)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">Heures</SelectItem>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="days">Jours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Niveau */}
          <div>
            <Label className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Niveau *
            </Label>
            <Select
              value={specs.level || ''}
              onValueChange={(v) => updateSpec('level', v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">🟢 Débutant</SelectItem>
                <SelectItem value="intermediate">🟡 Intermédiaire</SelectItem>
                <SelectItem value="advanced">🔴 Avancé</SelectItem>
                <SelectItem value="all">🔵 Tous niveaux</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Modules + Langue */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              Nombre de modules
            </Label>
            <Input
              type="number"
              placeholder="Ex: 10"
              min={1}
              value={specs.modules_count || ''}
              onChange={(e) => updateSpec('modules_count', parseInt(e.target.value) || undefined)}
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
                <SelectItem value="swahili">🇨🇩 Swahili</SelectItem>
                <SelectItem value="other">🌍 Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Certificat */}
        <div className="flex items-center justify-between p-3 bg-white dark:bg-background rounded-lg border">
          <div className="flex items-center gap-3">
            <Award className="h-5 w-5 text-amber-500" />
            <div>
              <Label className="cursor-pointer font-medium">Certificat inclus</Label>
              <p className="text-xs text-muted-foreground">L'apprenant recevra un certificat</p>
            </div>
          </div>
          <Switch
            checked={specs.has_certificate || false}
            onCheckedChange={(v) => updateSpec('has_certificate', v)}
          />
        </div>
      </CardContent>
    </Card>
  );
};
