import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Download, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RARITY_CONFIG } from '@/types/scratch-card';

interface WinRecord {
  id: string;
  name: string;
  value: number;
  currency: string;
  rarity: string;
  reward_type: string;
  scratch_revealed_at: string;
  created_at: string;
}

export const WinsHistory = () => {
  const [wins, setWins] = useState<WinRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_value: 0,
    total_wins: 0,
    win_rate: 0,
  });

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('lottery_wins')
        .select('*')
        .eq('user_id', user.id)
        .not('scratch_revealed_at', 'is', null)
        .order('scratch_revealed_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedWins = data?.map(w => ({
        id: w.id,
        name: `Prix ${w.rarity}`,
        value: w.prize_value || 0,
        currency: w.currency,
        rarity: w.rarity,
        reward_type: w.reward_type || 'cash',
        scratch_revealed_at: w.scratch_revealed_at,
        created_at: w.created_at,
      })) || [];

      setWins(formattedWins);

      // Calculer les stats
      const totalValue = formattedWins.reduce((sum, win) => sum + win.value, 0);
      const totalCount = formattedWins.length;
      
      setStats({
        total_value: totalValue,
        total_wins: totalCount,
        win_rate: totalCount > 0 ? (totalCount / (totalCount + 10)) * 100 : 0, // Estimation
      });
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityBadge = (rarity: string) => {
    const config = RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG];
    if (!config) return <Badge>{rarity}</Badge>;

    return (
      <Badge
        style={{
          backgroundColor: config.color,
          color: 'white',
        }}
      >
        {config.label}
      </Badge>
    );
  };

  const filterByRarity = (rarity?: string) => {
    if (!rarity) return wins;
    return wins.filter(w => w.rarity === rarity);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Chargement...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-4 px-2 sm:px-0">
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-primary">{stats.total_wins}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Gains Totaux</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-primary">
            {stats.total_value.toLocaleString()}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">CDF Gagnés</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-primary">
            {stats.win_rate.toFixed(0)}%
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Taux de Gain</p>
        </Card>
      </div>

      {/* History Tabs */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="hidden xs:inline">Historique des Gains</span>
            <span className="xs:hidden">Historique</span>
          </h3>
          <Button variant="outline" size="sm" className="text-xs">
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="w-full justify-start sm:justify-center overflow-x-auto">
            <TabsTrigger value="all" className="min-w-[60px] flex-shrink-0">Tous</TabsTrigger>
            <TabsTrigger value="common" className="min-w-[75px] flex-shrink-0">Commun</TabsTrigger>
            <TabsTrigger value="rare" className="min-w-[55px] flex-shrink-0">Rare</TabsTrigger>
            <TabsTrigger value="epic" className="min-w-[55px] flex-shrink-0">Epic</TabsTrigger>
            <TabsTrigger value="legendary" className="min-w-[90px] sm:min-w-[95px] flex-shrink-0">Légendaire</TabsTrigger>
          </TabsList>

          {['all', 'common', 'rare', 'epic', 'legendary'].map(tab => (
            <TabsContent key={tab} value={tab} className="mt-4">
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filterByRarity(tab === 'all' ? undefined : tab).map(win => (
                  <Card key={win.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{win.name}</h4>
                          {getRarityBadge(win.rarity)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(win.scratch_revealed_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">
                          {win.value.toLocaleString()} {win.currency}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {win.reward_type}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
                {filterByRarity(tab === 'all' ? undefined : tab).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun gain dans cette catégorie
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
};
