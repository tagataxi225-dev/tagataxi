import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Trophy, Gift, Clock, Coins, Package, Ticket as TicketIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLottery } from '@/hooks/useLottery';
import { toast } from 'sonner';

interface LotteryWinsGalleryProps {
  wins: Array<{
    id: string;
    draw_id: string;
    prize_details: any;
    prize_value: number;
    currency: string;
    status: string;
    claimed_at?: string;
    expires_at?: string;
  }>;
}

type FilterType = 'all' | 'cash' | 'points' | 'physical' | 'voucher';

export const LotteryWinsGallery: React.FC<LotteryWinsGalleryProps> = ({ wins }) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const { claimWin } = useLottery();

  const filteredWins = wins.filter(w => {
    if (filter === 'all') return true;
    const prizeType = w.prize_details?.reward_type || 'physical';
    return prizeType === filter;
  });

  const handleClaimWin = async (winId: string) => {
    try {
      await claimWin(winId);
      toast.success('Gain réclamé !', {
        description: 'Votre gain a été ajouté à votre compte'
      });
    } catch (error) {
      toast.error('Erreur', {
        description: 'Impossible de réclamer le gain'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'claimed': return 'bg-green-500';
      case 'credited': return 'bg-blue-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'À réclamer';
      case 'claimed': return 'Réclamé';
      case 'credited': return 'Crédité';
      case 'expired': return 'Expiré';
      default: return status;
    }
  };

  const getPrizeIcon = (prizeType: string) => {
    if (prizeType?.includes('cash')) return <Coins className="h-6 w-6 text-yellow-600" />;
    if (prizeType?.includes('points')) return <TicketIcon className="h-6 w-6 text-blue-600" />;
    if (prizeType?.includes('physical')) return <Package className="h-6 w-6 text-purple-600" />;
    return <Gift className="h-6 w-6 text-primary" />;
  };

  return (
    <div className="space-y-6">
      {/* Filtres animés */}
      <motion.div layout className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {(['all', 'cash', 'points', 'physical'] as FilterType[]).map(f => (
          <motion.button
            key={f}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap
              ${filter === f 
                ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            {f === 'all' ? 'Tous' : 
             f === 'cash' ? 'Argent' :
             f === 'points' ? 'Points' :
             'Cadeaux'}
          </motion.button>
        ))}
      </motion.div>

      {/* Grid avec animation stagger */}
      {filteredWins.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Aucun gain</h3>
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? 'Participez aux tirages pour gagner !' 
                : 'Aucun gain dans cette catégorie'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredWins.map((win, i) => {
              const prizeName = win.prize_details?.name || win.prize_details?.prize_name || 'Prix mystère';
              const prizeType = win.prize_details?.reward_type || 'physical';
              const canClaim = win.status === 'pending' && (!win.expires_at || new Date(win.expires_at) > new Date());
              
              return (
                <motion.div
                  key={win.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: i * 0.05 }
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                >
                  <Card className={`relative overflow-hidden border-2 transition-all ${
                    canClaim ? 'border-yellow-500 shadow-lg shadow-yellow-500/20' : 'border-border'
                  }`}>
                    {canClaim && (
                      <motion.div
                        className="absolute top-0 right-0 bg-yellow-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg z-10"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        À RÉCLAMER
                      </motion.div>
                    )}
                    
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-muted rounded-lg">
                            {getPrizeIcon(prizeType)}
                          </div>
                          <div>
                            <h4 className="font-semibold">{prizeName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {win.prize_value.toLocaleString()} {win.currency}
                            </p>
                            {win.claimed_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Réclamé le {format(new Date(win.claimed_at), 'PP', { locale: fr })}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <Badge 
                            className={`${getStatusColor(win.status)} text-white border-0`}
                          >
                            {getStatusLabel(win.status)}
                          </Badge>
                          
                          {canClaim && (
                            <Button
                              size="sm"
                              onClick={() => handleClaimWin(win.id)}
                              className="text-xs"
                            >
                              <Gift className="h-3 w-3 mr-1" />
                              Réclamer
                            </Button>
                          )}
                          
                          {win.expires_at && win.status === 'pending' && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(win.expires_at), 'PP', { locale: fr })}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};
