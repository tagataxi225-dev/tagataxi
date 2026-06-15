import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, Zap } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  score: number;
  rank: number;
}

export const LotteryLeaderboard = () => {
  const [topScratchers, setTopScratchers] = useState<LeaderboardEntry[]>([]);
  const [topWinners, setTopWinners] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    try {
      // Top gratteurs (nombre de cartes)
      const { data: scratchers } = await supabase
        .from('lottery_wins')
        .select('user_id, clients(display_name)')
        .not('scratch_revealed_at', 'is', null)
        .limit(100);

      if (scratchers) {
        const counts = scratchers.reduce((acc: any, win: any) => {
          const userId = win.user_id;
          const name = win.clients?.display_name || 'Utilisateur';
          if (!acc[userId]) {
            acc[userId] = { user_id: userId, display_name: name, score: 0 };
          }
          acc[userId].score++;
          return acc;
        }, {});

        const sorted = Object.values(counts)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 10)
          .map((entry: any, index) => ({ ...entry, rank: index + 1 }));

        setTopScratchers(sorted as LeaderboardEntry[]);
      }

      // Top gagnants (valeur totale)
      const { data: winners } = await supabase
        .from('lottery_wins')
        .select('user_id, value, clients(display_name)')
        .not('scratch_revealed_at', 'is', null)
        .limit(100);

      if (winners) {
        const totals = winners.reduce((acc: any, win: any) => {
          const userId = win.user_id;
          const name = win.clients?.display_name || 'Utilisateur';
          if (!acc[userId]) {
            acc[userId] = { user_id: userId, display_name: name, score: 0 };
          }
          acc[userId].score += win.value || 0;
          return acc;
        }, {});

        const sorted = Object.values(totals)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 10)
          .map((entry: any, index) => ({ ...entry, rank: index + 1 }));

        setTopWinners(sorted as LeaderboardEntry[]);
      }
    } catch (error) {
      console.error('Error loading leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return <Trophy className={`h-5 w-5 ${getRankColor(rank)}`} />;
    return <span className="text-muted-foreground">{rank}</span>;
  };

  const LeaderboardList = ({ entries, showValue }: { entries: LeaderboardEntry[], showValue?: boolean }) => (
    <div className="space-y-2">
      {entries.map((entry) => (
        <Card key={entry.user_id} className="p-3 flex items-center gap-3">
          <div className="w-8 text-center">
            {getRankIcon(entry.rank)}
          </div>
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {entry.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-semibold">{entry.display_name}</div>
            <div className="text-xs text-muted-foreground">
              {showValue ? `${entry.score.toLocaleString()} CDF` : `${entry.score} cartes`}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Chargement...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        Classement du Mois
      </h3>

      <Tabs defaultValue="scratchers">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scratchers" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Top Gratteurs
          </TabsTrigger>
          <TabsTrigger value="winners" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Gagnants
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scratchers" className="mt-4">
          {topScratchers.length > 0 ? (
            <LeaderboardList entries={topScratchers} />
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Aucun classement disponible
            </div>
          )}
        </TabsContent>

        <TabsContent value="winners" className="mt-4">
          {topWinners.length > 0 ? (
            <LeaderboardList entries={topWinners} showValue />
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Aucun classement disponible
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};
