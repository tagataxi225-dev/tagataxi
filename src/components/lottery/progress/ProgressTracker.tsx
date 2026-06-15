import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Gift, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const ProgressTracker = () => {
  const [pityTracker, setPityTracker] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPityTracker();
  }, []);

  const loadPityTracker = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('scratch_card_pity_tracker')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setPityTracker(data);
    } catch (error) {
      console.error('Error loading pity tracker:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !pityTracker) {
    return null;
  }

  const rareProgress = (pityTracker.commons_streak / pityTracker.guaranteed_rare_at) * 100;
  const epicProgress = (pityTracker.total_scratched % pityTracker.guaranteed_epic_at / pityTracker.guaranteed_epic_at) * 100;
  const legendaryProgress = (pityTracker.total_scratched % pityTracker.guaranteed_legendary_at / pityTracker.guaranteed_legendary_at) * 100;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        Progression vers Garanties
      </h3>

      <div className="space-y-4">
        {/* Rare Garanti */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              💙 Rare Garanti
            </span>
            <Badge variant="secondary">
              {pityTracker.guaranteed_rare_at - pityTracker.commons_streak} cartes
            </Badge>
          </div>
          <Progress value={rareProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {pityTracker.commons_streak} / {pityTracker.guaranteed_rare_at} cartes communes
          </p>
        </div>

        {/* Epic Garanti */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              💜 Epic Garanti
            </span>
            <Badge variant="secondary">
              {pityTracker.guaranteed_epic_at - (pityTracker.total_scratched % pityTracker.guaranteed_epic_at)} cartes
            </Badge>
          </div>
          <Progress value={epicProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {pityTracker.total_scratched % pityTracker.guaranteed_epic_at} / {pityTracker.guaranteed_epic_at} cartes totales
          </p>
        </div>

        {/* Legendary Garanti */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              🌟 Legendary Garanti
            </span>
            <Badge variant="secondary">
              {pityTracker.guaranteed_legendary_at - (pityTracker.total_scratched % pityTracker.guaranteed_legendary_at)} cartes
            </Badge>
          </div>
          <Progress value={legendaryProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {pityTracker.total_scratched % pityTracker.guaranteed_legendary_at} / {pityTracker.guaranteed_legendary_at} cartes totales
          </p>
        </div>
      </div>

      {pityTracker.active_multiplier > 1.0 && pityTracker.multiplier_expires_at && new Date(pityTracker.multiplier_expires_at) > new Date() && (
        <div className="mt-4 p-3 bg-primary/10 rounded-lg">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              Multiplicateur actif: x{pityTracker.active_multiplier}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};
