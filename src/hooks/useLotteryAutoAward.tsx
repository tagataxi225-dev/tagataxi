import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type EventType = 'ride' | 'delivery' | 'purchase' | 'referral' | 'rating' | 'daily_login';

export const useLotteryAutoAward = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // All probability logic is now server-side
  const awardCardOnEvent = async (
    eventType: EventType,
    metadata?: Record<string, any>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.functions.invoke('lottery-system', {
        body: {
          action: 'auto_award_check',
          userId: user.id,
          sourceType: eventType,
          metadata,
        }
      });

      if (error) {
        console.error('❌ Erreur auto-award:', error);
        return false;
      }

      if (data?.awarded) {
        toast.success('🎰 Carte à gratter gagnée !', {
          description: `Suite à votre action`,
          duration: 6000,
          action: {
            label: 'Voir',
            onClick: () => navigate('/app?view=lottery')
          }
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erreur attribution carte:', error);
      return false;
    }
  };

  const awardForRide = (rideId: string) => awardCardOnEvent('ride', { ride_id: rideId });
  const awardForDelivery = (deliveryId: string) => awardCardOnEvent('delivery', { delivery_id: deliveryId });
  const awardForPurchase = (orderId: string, amount: number) => awardCardOnEvent('purchase', { order_id: orderId, amount });
  const awardForReferral = (referredUserId: string) => awardCardOnEvent('referral', { referred_user_id: referredUserId });
  const awardForRating = (ratingId: string, stars: number) => {
    if (stars === 5) return awardCardOnEvent('rating', { rating_id: ratingId, stars });
    return Promise.resolve(false);
  };
  const awardForDailyLogin = () => awardCardOnEvent('daily_login');

  return {
    awardCardOnEvent,
    awardForRide,
    awardForDelivery,
    awardForPurchase,
    awardForReferral,
    awardForRating,
    awardForDailyLogin,
  };
};
