export interface QRChannel {
  id: string;
  name: string;
  baseUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  color: string;
  description: string;
  icon: string;
}

export interface DownloadOptions {
  format: 'png' | 'svg';
  size: 256 | 512 | 1024 | 2048;
  withLogo: boolean;
  withBorder: boolean;
  withLabel: boolean;
  backgroundColor: string;
  foregroundColor: string;
}

export const DISTRIBUTION_CHANNELS: QRChannel[] = [
  // Réseaux sociaux
  {
    id: 'facebook',
    name: 'Facebook',
    baseUrl: 'https://tagago.app/install',
    utmSource: 'facebook',
    utmMedium: 'social',
    utmCampaign: 'organic_post',
    color: '#1877F2',
    description: 'Posts et publicités Facebook',
    icon: 'Facebook'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    baseUrl: 'https://tagago.app/install',
    utmSource: 'instagram',
    utmMedium: 'social',
    utmCampaign: 'stories',
    color: '#E4405F',
    description: 'Stories et posts Instagram',
    icon: 'Instagram'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    baseUrl: 'https://tagago.app/install',
    utmSource: 'whatsapp',
    utmMedium: 'messaging',
    utmCampaign: 'viral_share',
    color: '#25D366',
    description: 'Partage viral WhatsApp',
    icon: 'MessageCircle'
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    baseUrl: 'https://tagago.app/install',
    utmSource: 'twitter',
    utmMedium: 'social',
    utmCampaign: 'tweet',
    color: '#1DA1F2',
    description: 'Tweets et threads',
    icon: 'Twitter'
  },
  
  // Marketing physique
  {
    id: 'poster_kinshasa',
    name: 'Affiches Kinshasa',
    baseUrl: 'https://tagago.app/install',
    utmSource: 'poster',
    utmMedium: 'outdoor',
    utmCampaign: 'kinshasa_streets',
    color: '#DC2626',
    description: 'Affiches dans les rues de Kinshasa',
    icon: 'FileImage'
  },
  {
    id: 'poster_lubumbashi',
    name: 'Affiches Lubumbashi',
    baseUrl: 'https://tagago.app/install',
    utmSource: 'poster',
    utmMedium: 'outdoor',
    utmCampaign: 'lubumbashi_streets',
    color: '#DC2626',
    description: 'Affiches Lubumbashi',
    icon: 'FileImage'
  },
  {
    id: 'flyer',
    name: 'Flyers/Tracts',
    baseUrl: 'https://tagago.app/install',
    utmSource: 'flyer',
    utmMedium: 'print',
    utmCampaign: 'distribution',
    color: '#F59E0B',
    description: 'Distribution de flyers',
    icon: 'FileText'
  },
  {
    id: 'business_card',
    name: 'Cartes de visite',
    baseUrl: 'https://tagago.app/install',
    utmSource: 'business_card',
    utmMedium: 'print',
    utmCampaign: 'networking',
    color: '#8B5CF6',
    description: 'Cartes de visite équipe',
    icon: 'CreditCard'
  },
  
  // Partenaires
  {
    id: 'partner_restaurant',
    name: 'Restaurants partenaires',
    baseUrl: 'https://tagago.app/install',
    utmSource: 'partner',
    utmMedium: 'referral',
    utmCampaign: 'restaurant_table',
    color: '#10B981',
    description: 'QR sur tables restaurants',
    icon: 'Utensils'
  },
  {
    id: 'partner_hotel',
    name: 'Hôtels partenaires',
    baseUrl: 'https://tagago.app/install',
    utmSource: 'partner',
    utmMedium: 'referral',
    utmCampaign: 'hotel_reception',
    color: '#3B82F6',
    description: 'Réceptions hôtels',
    icon: 'Building'
  },
  {
    id: 'partner_shop',
    name: 'Boutiques partenaires',
    baseUrl: 'https://tagago.app/install',
    utmSource: 'partner',
    utmMedium: 'referral',
    utmCampaign: 'shop_counter',
    color: '#EC4899',
    description: 'Comptoirs boutiques',
    icon: 'ShoppingBag'
  },
  
  // Événements
  {
    id: 'event_booth',
    name: 'Stand événementiel',
    baseUrl: 'https://tagago.app/install',
    utmSource: 'event',
    utmMedium: 'offline',
    utmCampaign: 'booth',
    color: '#F97316',
    description: 'Stands salons/foires',
    icon: 'Calendar'
  },
  {
    id: 'event_conference',
    name: 'Conférence',
    baseUrl: 'https://tagago.app/install',
    utmSource: 'event',
    utmMedium: 'offline',
    utmCampaign: 'conference_slide',
    color: '#06B6D4',
    description: 'Présentations/conférences',
    icon: 'Presentation'
  },
  
  // Transport
  {
    id: 'vehicle_sticker',
    name: 'Sticker véhicule',
    baseUrl: 'https://tagago.app/install',
    utmSource: 'vehicle',
    utmMedium: 'outdoor',
    utmCampaign: 'car_branding',
    color: '#EF4444',
    description: 'QR sur véhicules TAGA',
    icon: 'Car'
  },
  {
    id: 'driver_card',
    name: 'Carte chauffeur',
    baseUrl: 'https://tagago.app/install',
    utmSource: 'driver',
    utmMedium: 'referral',
    utmCampaign: 'driver_card',
    color: '#F59E0B',
    description: 'Cartes chauffeurs',
    icon: 'IdCard'
  },
  
  // SMS & Email
  {
    id: 'sms_campaign',
    name: 'Campagne SMS',
    baseUrl: 'https://tagago.app/install',
    utmSource: 'sms',
    utmMedium: 'messaging',
    utmCampaign: 'bulk_send',
    color: '#14B8A6',
    description: 'Envois SMS groupés',
    icon: 'Smartphone'
  },
  {
    id: 'email_newsletter',
    name: 'Newsletter Email',
    baseUrl: 'https://tagago.app/install',
    utmSource: 'email',
    utmMedium: 'email',
    utmCampaign: 'newsletter',
    color: '#6366F1',
    description: 'Newsletters email',
    icon: 'Mail'
  }
];

export const generateTrackedUrl = (
  channel: QRChannel,
  customParams?: Record<string, string>
): string => {
  const url = new URL(channel.baseUrl);
  url.searchParams.append('utm_source', channel.utmSource);
  url.searchParams.append('utm_medium', channel.utmMedium);
  url.searchParams.append('utm_campaign', channel.utmCampaign);
  url.searchParams.append('qr_channel', channel.id);
  
  if (customParams) {
    Object.entries(customParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  return url.toString();
};

export const downloadQRCode = (
  channelId: string,
  format: 'png' | 'svg',
  size: number
) => {
  const canvas = document.getElementById(`qr-${channelId}`) as HTMLCanvasElement;
  if (!canvas) return;

  if (format === 'png') {
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `kwenda-qr-${channelId}-${size}px.png`;
    link.href = url;
    link.click();
  } else {
    // SVG export would require additional library
    console.log('SVG export à implémenter');
  }
};
