import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QRTrackingData {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  channelId?: string | null;
  userAgent: string;
  referrer: string;
}

export const useQRTracking = () => {
  useEffect(() => {
    const trackQRScan = async () => {
      const params = new URLSearchParams(window.location.search);
      const utmSource = params.get('utm_source');
      const utmMedium = params.get('utm_medium');
      const utmCampaign = params.get('utm_campaign');
      const channelId = params.get('qr_channel');

      // Seulement tracker si on a des paramètres UTM
      if (!utmSource && !channelId) return;

      const trackingData: QRTrackingData = {
        utmSource,
        utmMedium,
        utmCampaign,
        channelId,
        userAgent: navigator.userAgent,
        referrer: document.referrer
      };

      try {
        // Détecter le type d'appareil
        const deviceType = /mobile/i.test(navigator.userAgent)
          ? 'mobile'
          : /tablet/i.test(navigator.userAgent)
          ? 'tablet'
          : 'desktop';

        await supabase.from('qr_code_scans').insert({
          channel_id: channelId || utmSource || 'unknown',
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          user_agent: trackingData.userAgent,
          referrer: trackingData.referrer,
          device_type: deviceType,
          scanned_at: new Date().toISOString()
        });

        // Stocker en localStorage pour tracking conversion ultérieur
        if (utmSource || channelId) {
          localStorage.setItem('qr_scan_source', channelId || utmSource || '');
          localStorage.setItem('qr_scan_time', new Date().toISOString());
        }
      } catch (error) {
        console.error('Erreur tracking QR:', error);
      }
    };

    trackQRScan();
  }, []);

  const trackConversion = async () => {
    const scanSource = localStorage.getItem('qr_scan_source');
    if (!scanSource) return;

    try {
      const scanTime = localStorage.getItem('qr_scan_time');
      
      await supabase
        .from('qr_code_scans')
        .update({
          converted: true,
          converted_at: new Date().toISOString()
        })
        .eq('channel_id', scanSource)
        .gte('scanned_at', scanTime || new Date().toISOString());

      // Nettoyer le localStorage après conversion
      localStorage.removeItem('qr_scan_source');
      localStorage.removeItem('qr_scan_time');
    } catch (error) {
      console.error('Erreur tracking conversion:', error);
    }
  };

  return { trackConversion };
};
