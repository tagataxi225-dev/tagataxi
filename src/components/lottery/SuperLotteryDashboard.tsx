import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Crown, Trophy, Users, Sparkles, Gift, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface SuperLotteryDraw {
  id: string;
  name: string;
  description: string | null;
  draw_date: string;
  entry_cost_points: number;
  max_entries: number;
  current_entries: number;
  prize_pool: {
    first: number;
    second: number;
    third: number;
  };
  status: string;
}

export const SuperLotteryDashboard = () => {
  const { user } = useAuth();
  const [currentDraw, setCurrentDraw] = useState<SuperLotteryDraw | null>(null);
  const [myEntries, setMyEntries] = useState<any[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    loadCurrentDraw();
    loadUserPoints();
  }, [user]);

  const loadCurrentDraw = async () => {
    try {
      // Utiliser l'edge function pour créer/récupérer le tirage mensuel
      const { data, error } = await supabase.functions.invoke('lottery-system', {
        body: { action: 'get_or_create_monthly_draw' }
      });

      if (error) throw error;

      if (data?.success && data?.draw) {
        const draw = data.draw;
        setCurrentDraw({
          id: draw.id,
          name: draw.name,
          description: draw.description,
          draw_date: draw.draw_date,
          entry_cost_points: draw.entry_cost_points || 100,
          max_entries: draw.max_entries || 1000,
          current_entries: draw.current_entries || 0,
          prize_pool: draw.prize_pool || { first: 50000, second: 30000, third: 20000 },
          status: draw.status || 'active'
        });

        // Charger mes entrées pour ce tirage
        if (user) {
          const { data: entries } = await supabase
            .from('super_lottery_entries')
            .select('*')
            .eq('draw_id', draw.id)
            .eq('user_id', user.id);
          
          setMyEntries(entries || []);
        }
      }
    } catch (error) {
      console.error('Erreur chargement super-loterie:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPoints = async () => {
    if (!user) return;
    
    try {
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('kwenda_points')
        .eq('user_id', user.id)
        .maybeSingle();

      setUserPoints(wallet?.kwenda_points || 0);
    } catch (error) {
      console.error('Erreur chargement points:', error);
    }
  };

  const handleEnter = async () => {
    if (!currentDraw || !user) return;

    if (userPoints < currentDraw.entry_cost_points) {
      toast.error(`Vous avez besoin de ${currentDraw.entry_cost_points} points`);
      return;
    }

    setEntering(true);
    try {
      const { data, error } = await supabase.functions.invoke('lottery-system', {
        body: { 
          action: 'enter_super_lottery',
          userId: user.id,
          drawId: currentDraw.id,
          pointsCost: currentDraw.entry_cost_points
        }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.success) {
        toast.success(`🎉 Entrée enregistrée ! N° ${data.entryNumber}`);
        await loadCurrentDraw();
        await loadUserPoints();
      }
    } catch (error: any) {
      console.error('Erreur participation:', error);
      toast.error('Impossible de participer');
    } finally {
      setEntering(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentDraw) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <Crown className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-base font-medium">Aucune super-loterie en cours</p>
        </CardContent>
      </Card>
    );
  }

  const daysUntilDraw = Math.max(0, Math.ceil(
    (new Date(currentDraw.draw_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ));
  const progressPercent = Math.min(100, (currentDraw.current_entries / currentDraw.max_entries) * 100);
  const canAfford = userPoints >= currentDraw.entry_cost_points;
  const totalPrizePool = currentDraw.prize_pool.first + currentDraw.prize_pool.second + currentDraw.prize_pool.third;

  return (
    <div className="space-y-4">
      {/* Header avec gradient */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 p-6 border-2 border-yellow-500/30"
      >
        <div className="relative flex items-center gap-4">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Crown className="h-12 w-12 text-yellow-500" />
          </motion.div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-1">{currentDraw.name}</h3>
            <p className="text-sm text-muted-foreground">
              Tirage dans {daysUntilDraw} jour{daysUntilDraw > 1 ? 's' : ''}
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {currentDraw.current_entries} / {currentDraw.max_entries}
          </Badge>
        </div>
      </motion.div>

      {/* Prize Pool */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cagnotte Totale</CardTitle>
              <CardDescription>Répartie entre 3 gagnants</CardDescription>
            </div>
            <Gift className="h-8 w-8 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-5xl font-extrabold text-primary mb-2"
            >
              {totalPrizePool.toLocaleString()}
            </motion.div>
            <p className="text-sm text-muted-foreground">CDF à gagner</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">1er Prix</span>
              </div>
              <span className="text-xl font-bold">{currentDraw.prize_pool.first.toLocaleString()} CDF</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">2ème Prix</span>
              </div>
              <span className="text-lg font-bold">{currentDraw.prize_pool.second.toLocaleString()} CDF</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-600/10">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-orange-600" />
                <span className="font-medium">3ème Prix</span>
              </div>
              <span className="text-lg font-bold">{currentDraw.prize_pool.third.toLocaleString()} CDF</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participation */}
      <Card>
        <CardHeader>
          <CardTitle>Participer</CardTitle>
          <CardDescription>Coût : {currentDraw.entry_cost_points} Tembea Points</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Vos points</p>
              <p className="text-2xl font-bold">{userPoints.toLocaleString()}</p>
            </div>
            <Sparkles className="h-8 w-8 text-primary" />
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleEnter}
            disabled={!canAfford || entering}
          >
            {entering ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Trophy className="mr-2 h-5 w-5" />
            )}
            {canAfford 
              ? `Participer (${currentDraw.entry_cost_points} points)` 
              : `Pas assez de points (${currentDraw.entry_cost_points} requis)`
            }
          </Button>

          {myEntries.length > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                ✅ Vous avez {myEntries.length} entrée{myEntries.length > 1 ? 's' : ''} pour ce tirage
              </p>
              <div className="mt-2 space-y-1">
                {myEntries.slice(0, 3).map((entry) => (
                  <p key={entry.id} className="text-xs text-muted-foreground font-mono">
                    {entry.entry_number}
                  </p>
                ))}
                {myEntries.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{myEntries.length - 3} autre(s)...
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Participation</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {currentDraw.current_entries} participants sur {currentDraw.max_entries} max
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
