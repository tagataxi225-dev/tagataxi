import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScratchCard } from './ScratchCard';
import { ScratchCardWin } from '@/types/scratch-card';
import { supabase } from '@/integrations/supabase/client';
import { Ticket, Trophy, Gift, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { StatsCard } from '../StatsCard';

export const ScratchCardGallery: React.FC = () => {
  const [wins, setWins] = useState<ScratchCardWin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWins();

    // Subscribe to new scratch cards
    const channel = supabase
      .channel('scratch-cards')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lottery_wins',
          filter: `user_id=eq.${supabase.auth.getUser().then(u => u.data.user?.id)}`
        },
        () => {
          loadWins();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadWins = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('lottery_wins')
        .select(`
          id,
          prize_details,
          created_at,
          status,
          scratch_revealed_at,
          scratch_percentage,
          rarity,
          reward_type,
          points_awarded
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedWins: ScratchCardWin[] = (data || []).map(win => {
        const details = win.prize_details as any;
        return {
          win_id: win.id,
          id: details?.prize_id || win.id,
          name: details?.name || 'Prix',
          value: details?.value || 0,
          currency: details?.currency || 'CDF',
          rarity: (win.rarity || 'common') as any,
          reward_type: (win.reward_type || 'cash') as any,
          image_url: details?.image_url,
          scratch_percentage: win.scratch_percentage || 0,
          scratch_revealed_at: win.scratch_revealed_at,
          created_at: win.created_at
        };
      });

      setWins(formattedWins);
    } catch (error) {
      console.error('Error loading scratch cards:', error);
      toast.error('Erreur lors du chargement des cartes');
    } finally {
      setLoading(false);
    }
  };

  const unscratched = wins.filter(w => !w.scratch_revealed_at && w.scratch_percentage < 70);
  const revealed = wins.filter(w => w.scratch_revealed_at || w.scratch_percentage >= 70);

  if (loading && wins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Chargement des cartes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats compactes optimisées */}
      <div className="grid grid-cols-3 gap-2">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="lottery-stats-card h-18 relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/5 dark:to-cyan-500/5 rounded-xl p-3 border border-border/50 dark:border-border/30"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="relative flex items-center gap-2">
            <Ticket className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-xl font-bold">{unscratched.length}</div>
              <div className="text-xs text-muted-foreground">À gratter</div>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="lottery-stats-card h-18 relative overflow-hidden bg-gradient-to-br from-yellow-500/10 to-orange-500/10 dark:from-yellow-500/5 dark:to-orange-500/5 rounded-xl p-3 border border-border/50 dark:border-border/30"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          <div className="relative flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <div>
              <div className="text-xl font-bold">{revealed.length}</div>
              <div className="text-xs text-muted-foreground">Révélées</div>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="lottery-stats-card h-18 relative overflow-hidden bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/5 dark:to-emerald-500/5 rounded-xl p-3 border border-border/50 dark:border-border/30"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          />
          <div className="relative flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-xl font-bold">{wins.length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="scratch" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scratch">
            À gratter ({unscratched.length})
          </TabsTrigger>
          <TabsTrigger value="revealed">
            Révélées ({revealed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scratch" className="space-y-4 mt-6">
          {unscratched.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {unscratched.map((win, index) => (
                  <motion.div
                    key={win.win_id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1, 
                      y: 0,
                      transition: { delay: index * 0.1 } 
                    }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    whileHover={{ scale: 1.03, zIndex: 10 }}
                  >
                    <ScratchCard
                      win={win}
                      onReveal={loadWins}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <Card className="border-dashed border-2 dark:border-muted/50">
              <CardContent className="pt-12 pb-12 text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Ticket className="h-16 w-16 mx-auto mb-4 text-primary/50" />
                </motion.div>
                <p className="text-lg font-semibold mb-2">Aucune carte à gratter</p>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Gagnez des cartes en effectuant des <strong>courses 🚗</strong>, des <strong>livraisons 📦</strong> ou des <strong>achats 🛒</strong> sur la plateforme !
                </p>
                
                <div className="space-y-3">
                  <Button 
                    size="lg"
                    className="w-full max-w-xs mx-auto animate-pulse"
                    onClick={() => window.location.href = '/test-lottery'}
                  >
                    🎮 Mode Test - Générer une carte
                  </Button>
                  
                  <div className="text-xs text-muted-foreground mt-4 space-y-1 max-w-xs mx-auto">
                    <p className="font-semibold">📊 Vos chances de gagner une carte :</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="p-2 rounded bg-muted/50">
                        <p>🚗 Course</p>
                        <p className="font-bold text-primary">15%</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p>📦 Livraison</p>
                        <p className="font-bold text-primary">10%</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p>🛒 Achat</p>
                        <p className="font-bold text-primary">20%</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p>🤝 Parrainage</p>
                        <p className="font-bold text-primary">100%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="revealed" className="space-y-4 mt-6">
          {revealed.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {revealed.map((win, index) => (
                  <motion.div
                    key={win.win_id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      transition: { delay: index * 0.1 }
                    }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <ScratchCard
                      win={win}
                      onReveal={loadWins}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <Card className="border-dashed border-2 dark:border-muted/50">
              <CardContent className="pt-12 pb-12 text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-primary/50" />
                </motion.div>
                <p className="text-base font-medium">Aucune carte révélée</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Commencez à gratter vos tickets !
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
