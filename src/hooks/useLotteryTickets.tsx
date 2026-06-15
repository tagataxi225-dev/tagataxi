import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export const useLotteryTickets = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Attribuer des tickets automatiquement
  const awardTickets = async (
    sourceType: 'transport' | 'delivery' | 'marketplace_buy' | 'marketplace_sell' | 'referral' | 'daily_login' | 'challenge' | 'rating',
    sourceId?: string,
    count: number = 1,
    multiplier: number = 1
  ) => {
    if (!user) return null;

    try {
      console.log(`Attribution de ${count} tickets pour action: ${sourceType}`, { user: user.id, sourceId });

      const { data, error } = await supabase.functions.invoke('lottery-system', {
        body: {
          action: 'award_ticket',
          userId: user.id,
          sourceType,
          sourceId,
          count,
          multiplier
        }
      });

      console.log('Réponse Edge Function:', { data, error });

      if (error) {
        console.error('Erreur Edge Function:', error);
        return null;
      }

      // Notification de succès
      if (data?.tickets?.length > 0) {
        const ticketCount = data.tickets.length;
        const bonusText = multiplier > 1 ? ` (x${multiplier} bonus!)` : '';
        
        toast({
          title: "🎫 Nouveaux tickets gagnés !",
          description: `+${ticketCount} ticket${ticketCount > 1 ? 's' : ''} de tombola${bonusText}`,
          duration: 4000,
        });

        // Générer automatiquement une carte à gratter (10% de chance, limite serveur)
      if (Math.random() < 0.10) {
          try {
            await supabase.functions.invoke('lottery-system', {
              body: {
                action: 'generate_scratch_card',
                userId: user.id
              }
            });
            
            toast({
              title: "🎰 Nouvelle carte à gratter !",
              description: "Rendez-vous dans la Tombola",
              duration: 6000,
            });
          } catch (error) {
            console.error('Erreur génération carte:', error);
          }
        }
      }

      return data?.tickets || [];
    } catch (error) {
      console.error('Erreur lors de l\'attribution des tickets:', error);
      return null;
    }
  };

  // Tickets pour actions spécifiques
  const awardTransportTickets = async (bookingId: string) => {
    return await awardTickets('transport', bookingId, 1);
  };

  const awardDeliveryTickets = async (deliveryId: string) => {
    return await awardTickets('delivery', deliveryId, 2); // 2 tickets pour livraison
  };

  const awardMarketplaceBuyTickets = async (orderId: string) => {
    return await awardTickets('marketplace_buy', orderId, 1);
  };

  const awardMarketplaceSellTickets = async (productId: string) => {
    return await awardTickets('marketplace_sell', productId, 3); // 3 tickets pour vente
  };

  const awardReferralTickets = async (referralId: string) => {
    return await awardTickets('referral', referralId, 5); // 5 tickets pour parrainage
  };

  const awardRatingTickets = async (ratingId: string, stars: number) => {
    // Bonus pour évaluations 5 étoiles
    const count = stars === 5 ? 1 : 0;
    if (count > 0) {
      return await awardTickets('rating', ratingId, count);
    }
    return null;
  };

  const awardDailyLoginTickets = async () => {
    if (!user) return null;

    try {
      // Vérifier si l'utilisateur a déjà reçu ses tickets aujourd'hui
      const today = new Date().toDateString();
      const { data: existingTickets, error } = await supabase
        .from('lottery_tickets')
        .select('id')
        .eq('user_id', user.id)
        .eq('source_type', 'daily_login')
        .gte('earned_date', new Date(today).toISOString())
        .limit(1);

      if (error) {
        console.error('Erreur vérification tickets quotidiens:', error);
        return null;
      }

      if (existingTickets && existingTickets.length > 0) {
        console.log('Tickets de connexion quotidienne déjà attribués');
        return null;
      }

      return await awardTickets('daily_login', undefined, 1);
    } catch (error) {
      console.error('Erreur awardDailyLoginTickets:', error);
      return null;
    }
  };

  const awardChallengeTickets = async (challengeId: string, bonusCount: number = 2) => {
    return await awardTickets('challenge', challengeId, bonusCount);
  };

  // Vérifier les multiplicateurs d'événements spéciaux
  const getEventMultiplier = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    // Week-end bonus (samedi-dimanche)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 2;
    }
    
    // Vérifier s'il y a des événements spéciaux
    // TODO: Implémenter la logique d'événements spéciaux depuis la DB
    
    return 1;
  };

  return {
    awardTickets,
    awardTransportTickets,
    awardDeliveryTickets,
    awardMarketplaceBuyTickets,
    awardMarketplaceSellTickets,
    awardReferralTickets,
    awardRatingTickets,
    awardDailyLoginTickets,
    awardChallengeTickets,
    getEventMultiplier
  };
};