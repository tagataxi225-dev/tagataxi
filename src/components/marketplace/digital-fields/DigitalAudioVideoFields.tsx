import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Music, Video, Clock, Monitor, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DigitalAudioVideoFieldsProps {
  type: 'audio' | 'video';
  specs: {
    duration_value?: number;
    duration_unit?: string;
    quality?: string;
    formats_included?: string[];
    genre?: string;
  };
  onChange: (specs: any) => void;
}

const AUDIO_FORMATS = ['MP3', 'WAV', 'FLAC', 'AAC', 'OGG'];
const VIDEO_FORMATS = ['MP4', 'MOV', 'AVI', 'MKV', 'WEBM'];

const AUDIO_QUALITIES = [
  { value: '128kbps', label: '128 kbps (Standard)' },
  { value: '320kbps', label: '320 kbps (Haute qualité)' },
  { value: 'lossless', label: 'Lossless (Sans perte)' },
];

const VIDEO_QUALITIES = [
  { value: '720p', label: '720p HD' },
  { value: '1080p', label: '1080p Full HD' },
  { value: '2k', label: '2K QHD' },
  { value: '4k', label: '4K Ultra HD' },
];

export const DigitalAudioVideoFields: React.FC<DigitalAudioVideoFieldsProps> = ({ type, specs, onChange }) => {
  const isAudio = type === 'audio';
  const Icon = isAudio ? Music : Video;
  const formats = isAudio ? AUDIO_FORMATS : VIDEO_FORMATS;
  const qualities = isAudio ? AUDIO_QUALITIES : VIDEO_QUALITIES;
  const colorClass = isAudio 
    ? 'border-amber-200 dark:border-amber-800 from-amber-50/50 dark:from-amber-950/20' 
    : 'border-rose-200 dark:border-rose-800 from-rose-50/50 dark:from-rose-950/20';
  const iconColor = isAudio ? 'text-amber-600' : 'text-rose-600';
  const titleColor = isAudio ? 'text-amber-700 dark:text-amber-300' : 'text-rose-700 dark:text-rose-300';
  const badgeColor = isAudio 
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';

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
    <Card className={cn("bg-gradient-to-br to-transparent", colorClass)}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={cn("h-5 w-5", iconColor)} />
          <span className={cn("font-semibold", titleColor)}>
            Détails {isAudio ? 'audio' : 'vidéo'}
          </span>
        </div>

        {/* Durée */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Durée totale *
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="number"
                placeholder="Ex: 45"
                min={1}
                value={specs.duration_value || ''}
                onChange={(e) => updateSpec('duration_value', parseInt(e.target.value) || undefined)}
                className="flex-1"
              />
              <Select
                value={specs.duration_unit || 'minutes'}
                onValueChange={(v) => updateSpec('duration_unit', v)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seconds">Sec</SelectItem>
                  <SelectItem value="minutes">Min</SelectItem>
                  <SelectItem value="hours">Heures</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Qualité */}
          <div>
            <Label className="flex items-center gap-2 text-sm">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              Qualité *
            </Label>
            <Select
              value={specs.quality || ''}
              onValueChange={(v) => updateSpec('quality', v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                {qualities.map(q => (
                  <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Genre */}
        <div>
          <Label className="flex items-center gap-2 text-sm">
            <Tag className="h-4 w-4 text-muted-foreground" />
            Genre / Catégorie
          </Label>
          <Input
            placeholder={isAudio ? "Ex: Pop, Afrobeat, Podcast..." : "Ex: Tutoriel, Documentaire, Vlog..."}
            value={specs.genre || ''}
            onChange={(e) => updateSpec('genre', e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Formats */}
        <div>
          <Label className="text-sm mb-2 block">Formats de fichiers inclus</Label>
          <div className="flex flex-wrap gap-2">
            {formats.map((format) => {
              const isSelected = (specs.formats_included || []).includes(format);
              return (
                <Badge
                  key={format}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all px-3 py-1.5 text-sm",
                    isSelected
                      ? badgeColor + " border-2 font-semibold"
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
