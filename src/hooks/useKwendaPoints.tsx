import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TembeaPoints {
  total_points: number;
  points_earned_today: number;
  points_earned_this_month: number;
  lifetime_points: number;
}

export const useKwendaPoints = () => {
  const [points, setPoints] = useState<TembeaPoints>({
    total_points: 0,
    points_earned_today: 0,
    points_earned_this_month: 0,
    lifetime_points: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadPoints = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer le portefeuille
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('kwenda_points')
        .eq('user_id', user.id)
        .maybeSingle();

      if (wallet) {
        setPoints({
          total_points: wallet.kwenda_points || 0,
          points_earned_today: 0, // TODO: calculer depuis activity_logs
          points_earned_this_month: 0,
          lifetime_points: wallet.kwenda_points || 0,
        });
      }
    } catch (error) {
      console.error('Error loading points:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateConversionBonus = (points: number): number => {
    if (points >= 500) return 0.15;
    if (points >= 250) return 0.10;
    if (points >= 100) return 0.05;
    return 0;
  };

  const convertToCredits = async (pointsToConvert: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (points.total_points < pointsToConvert) {
        toast({
          title: 'Points insuffisants',
          description: `Vous avez besoin de ${pointsToConvert} points mais vous n'en avez que ${points.total_points}`,
          variant: 'destructive',
        });
        return false;
      }

      // Seuil minimum
      if (pointsToConvert < 50) {
        toast({
          title: 'Minimum requis',
          description: 'Vous devez convertir au minimum 50 points (500 CDF)',
          variant: 'destructive',
        });
        return false;
      }

      // Conversion : 100 points = 1000 CDF + bonus progressif
      const baseCredits = (pointsToConvert / 100) * 1000;
      const bonusRate = calculateConversionBonus(pointsToConvert);
      const totalCredits = Math.round(baseCredits * (1 + bonusRate));

      // Mettre à jour le portefeuille avec ecosystem_credits
      const { data, error } = await supabase.rpc('convert_kwenda_points_to_ecosystem', {
        p_user_id: user.id,
        p_points: pointsToConvert,
        p_credits: totalCredits,
        p_bonus_rate: bonusRate,
      });

      if (error) throw error;

      const bonusText = bonusRate > 0 ? ` (bonus +${Math.round(bonusRate * 100)}%)` : '';
      
      toast({
        title: '✅ Conversion réussie',
        description: `${pointsToConvert} points → ${totalCredits.toLocaleString()} CDF Solde Bonus${bonusText}`,
      });

      await loadPoints();
      return true;
    } catch (error) {
      console.error('Error converting points:', error);
      toast({
        title: 'Erreur de conversion',
        description: error instanceof Error ? error.message : 'Impossible de convertir vos points',
        variant: 'destructive',
      });
      return false;
    }
  };

  const enterSuperLottery = async (drawId: string, pointsCost: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (points.total_points < pointsCost) {
        toast({
          title: 'Points insuffisants',
          description: `Cette entrée coûte ${pointsCost} points`,
          variant: 'destructive',
        });
        return false;
      }

      // Générer un numéro d'entrée unique
      const entryNumber = `SL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const { error } = await supabase
        .from('super_lottery_entries')
        .insert({
          draw_id: drawId,
          user_id: user.id,
          points_spent: pointsCost,
          entry_number: entryNumber,
        });

      if (error) throw error;

      // Déduire les points
      await supabase.rpc('deduct_kwenda_points', {
        p_user_id: user.id,
        p_points: pointsCost,
      });

      toast({
        title: '🎉 Entrée enregistrée !',
        description: `Votre numéro : ${entryNumber}`,
      });

      await loadPoints();
      return true;
    } catch (error) {
      console.error('Error entering super lottery:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer votre entrée',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    loadPoints();
  }, []);

  return {
    points,
    loading,
    refresh: loadPoints,
    convertToCredits,
    calculateConversionBonus,
    enterSuperLottery,
  };
};
