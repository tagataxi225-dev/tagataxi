import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Clock, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DayHours {
  open: string | null;
  close: string | null;
  is_closed: boolean;
}

interface OpeningHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

const defaultHours: OpeningHours = {
  monday: { open: '08:00', close: '18:00', is_closed: false },
  tuesday: { open: '08:00', close: '18:00', is_closed: false },
  wednesday: { open: '08:00', close: '18:00', is_closed: false },
  thursday: { open: '08:00', close: '18:00', is_closed: false },
  friday: { open: '08:00', close: '18:00', is_closed: false },
  saturday: { open: '09:00', close: '14:00', is_closed: false },
  sunday: { open: null, close: null, is_closed: true },
};

const dayLabels: Record<string, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
};

interface Props {
  partnerId: string;
  initialHours?: OpeningHours | null;
  onSave?: () => void;
}

export const PartnerOpeningHoursEditor: React.FC<Props> = ({ 
  partnerId, 
  initialHours, 
  onSave 
}) => {
  const [hours, setHours] = useState<OpeningHours>(initialHours || defaultHours);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialHours) {
      setHours(initialHours);
    }
  }, [initialHours]);

  const updateDay = (day: keyof OpeningHours, field: keyof DayHours, value: any) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('partenaires')
        .update({ opening_hours: JSON.parse(JSON.stringify(hours)) })
        .eq('id', partnerId);

      if (error) throw error;

      toast.success('Horaires enregistrés');
      onSave?.();
    } catch (error: any) {
      toast.error('Erreur lors de la sauvegarde');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-emerald-500/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-emerald-500" />
          Horaires d'ouverture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(Object.keys(dayLabels) as (keyof OpeningHours)[]).map((day) => (
          <div key={day} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
            <div className="w-24 font-medium text-sm">{dayLabels[day]}</div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={!hours[day].is_closed}
                onCheckedChange={(checked) => updateDay(day, 'is_closed', !checked)}
              />
              <Label className="text-xs text-muted-foreground">
                {hours[day].is_closed ? 'Fermé' : 'Ouvert'}
              </Label>
            </div>

            {!hours[day].is_closed && (
              <div className="flex items-center gap-2 ml-auto">
                <Input
                  type="time"
                  value={hours[day].open || ''}
                  onChange={(e) => updateDay(day, 'open', e.target.value)}
                  className="w-24 h-8 text-sm"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="time"
                  value={hours[day].close || ''}
                  onChange={(e) => updateDay(day, 'close', e.target.value)}
                  className="w-24 h-8 text-sm"
                />
              </div>
            )}
          </div>
        ))}

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Enregistrement...' : 'Enregistrer les horaires'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PartnerOpeningHoursEditor;
