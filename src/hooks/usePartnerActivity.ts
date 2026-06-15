import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface ActivityItem {
  id: string;
  description: string;
  time: string;
  type: 'driver' | 'vehicle' | 'commission' | 'booking';
}

export const usePartnerActivity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Récupérer le partner_id
        const { data: partnerData } = await supabase
          .from('partenaires')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!partnerData) return;

        // Récupérer les logs d'activité
        const { data: logs } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        // Récupérer les commissions récentes
        const { data: commissions } = await supabase
          .from('partner_subscription_earnings')
          .select('*, chauffeurs(display_name)')
          .eq('partner_id', partnerData.id)
          .order('payment_date', { ascending: false })
          .limit(5);

        const formattedActivities: ActivityItem[] = [];

        // Ajouter les commissions
        commissions?.forEach(commission => {
          formattedActivities.push({
            id: commission.id,
            description: `Commission de ${commission.partner_commission_amount.toLocaleString()} CDF versée`,
            time: formatDistanceToNow(new Date(commission.payment_date), { locale: fr, addSuffix: true }),
            type: 'commission'
          });
        });

        // Ajouter les logs généraux
        logs?.forEach(log => {
          const type = log.activity_type === 'driver_added' ? 'driver' :
                       log.activity_type === 'vehicle_added' ? 'vehicle' :
                       log.activity_type === 'booking_completed' ? 'booking' : 'commission';
          
          formattedActivities.push({
            id: log.id,
            description: log.description,
            time: formatDistanceToNow(new Date(log.created_at), { locale: fr, addSuffix: true }),
            type: type as ActivityItem['type']
          });
        });

        // Trier par date
        setActivities(formattedActivities.slice(0, 10));

      } catch (error) {
        console.error('Error fetching partner activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  return { activities, loading };
};