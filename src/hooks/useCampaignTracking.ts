import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CampaignTrackingData {
  campaign_id: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  qr_channel?: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
  user_agent: string;
  referrer?: string;
}

export const useCampaignTracking = (campaignId: string) => {
  const [visitorId, setVisitorId] = useState<string | null>(null);

  useEffect(() => {
    trackCampaignVisit();
  }, [campaignId]);

  const trackCampaignVisit = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      
      const trackingData: CampaignTrackingData = {
        campaign_id: campaignId,
        utm_source: urlParams.get('utm_source') || undefined,
        utm_medium: urlParams.get('utm_medium') || undefined,
        utm_campaign: urlParams.get('utm_campaign') || undefined,
        qr_channel: urlParams.get('qr_channel') || undefined,
        device_type: getDeviceType(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || undefined
      };

      const { data, error } = await supabase
        .from('campaign_visitors')
        .insert([trackingData])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setVisitorId(data.id);
        localStorage.setItem('campaign_visitor_id', data.id);
      }
    } catch (error) {
      console.error('Error tracking campaign visit:', error);
    }
  };

  const trackConversion = async (userId?: string) => {
    try {
      const storedVisitorId = visitorId || localStorage.getItem('campaign_visitor_id');
      
      if (!storedVisitorId) return;

      await supabase
        .from('campaign_conversions')
        .insert([{
          campaign_id: campaignId,
          visitor_id: storedVisitorId,
          user_id: userId
        }]);

      // Update visitor record
      await supabase
        .from('campaign_visitors')
        .update({ converted: true })
        .eq('id', storedVisitorId);

      localStorage.removeItem('campaign_visitor_id');
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  };

  const trackEvent = async (eventName: string, eventData?: Record<string, any>) => {
    try {
      const storedVisitorId = visitorId || localStorage.getItem('campaign_visitor_id');
      
      if (!storedVisitorId) return;

      await supabase
        .from('campaign_events')
        .insert([{
          campaign_id: campaignId,
          visitor_id: storedVisitorId,
          event_name: eventName,
          event_data: eventData
        }]);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  return {
    trackConversion,
    trackEvent,
    visitorId
  };
};

const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};
