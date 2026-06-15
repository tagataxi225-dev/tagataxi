import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NotificationCampaign {
  id: string;
  campaign_title: string;
  message_content: string;
  target_type: string;
  target_criteria: any;
  priority: string;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  sent_by: string;
  scheduled_for: string | null;
  sent_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useNotificationCampaigns = () => {
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    pending: 0,
    avgDeliveryRate: 0,
    avgOpenRate: 0
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCampaigns = useCallback(async () => {
    // Skip if tab is hidden
    if (document.hidden) return;

    try {
      const { data, error } = await supabase
        .from('notification_campaign_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setCampaigns(data as NotificationCampaign[] || []);
      
      if (data && data.length > 0) {
        const total = data.length;
        const sent = data.filter(c => c.status === 'sent').length;
        const pending = data.filter(c => c.status === 'pending').length;
        
        const sentCampaigns = data.filter(c => c.sent_count > 0);
        const avgDeliveryRate = sentCampaigns.length > 0
          ? sentCampaigns.reduce((acc, c) => acc + (c.delivered_count / c.sent_count * 100), 0) / sentCampaigns.length
          : 0;
        
        const deliveredCampaigns = data.filter(c => c.delivered_count > 0);
        const avgOpenRate = deliveredCampaigns.length > 0
          ? deliveredCampaigns.reduce((acc, c) => acc + (c.opened_count / c.delivered_count * 100), 0) / deliveredCampaigns.length
          : 0;
        
        setStats({ total, sent, pending, avgDeliveryRate, avgOpenRate });
      }
    } catch (error) {
      console.error('Erreur chargement campagnes:', error);
      toast.error('Erreur lors du chargement des campagnes');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCampaign = async (campaignData: {
    campaign_title: string;
    message_content: string;
    target_type: string;
    target_criteria: any;
    priority: string;
    scheduled_for?: string | null;
  }) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('notification_campaign_history')
        .insert([{
          ...campaignData,
          sent_by: userData.user.id,
          status: campaignData.scheduled_for ? 'pending' : 'sending'
        }]);

      if (error) throw error;
      
      toast.success('Campagne créée avec succès');
      await fetchCampaigns();
      return true;
    } catch (error) {
      console.error('Erreur création campagne:', error);
      toast.error('Erreur lors de la création de la campagne');
      return false;
    }
  };

  const updateCampaignStats = async (
    campaignId: string,
    stats: {
      sent_count?: number;
      delivered_count?: number;
      opened_count?: number;
      clicked_count?: number;
      status?: string;
      sent_at?: string;
    }
  ) => {
    try {
      const { error } = await supabase
        .from('notification_campaign_history')
        .update(stats)
        .eq('id', campaignId);

      if (error) throw error;
      await fetchCampaigns();
    } catch (error) {
      console.error('Erreur mise à jour stats:', error);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    
    // 120s polling with visibility guard
    intervalRef.current = setInterval(fetchCampaigns, 120000);

    const handleVisibility = () => {
      if (!document.hidden) fetchCampaigns();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchCampaigns]);

  return {
    campaigns,
    loading,
    stats,
    createCampaign,
    updateCampaignStats,
    refreshCampaigns: fetchCampaigns
  };
};
