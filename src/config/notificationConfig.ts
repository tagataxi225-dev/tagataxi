// Configuration centralisée pour toutes les notifications
// Durée maximale standardisée à 2 secondes (2000ms)

export const NOTIFICATION_CONFIG = {
  // Durées principales (en millisecondes)
  DEFAULT_DURATION: 2000,
  CRITICAL_DURATION: 1500, // Pour notifications critiques
  INFO_DURATION: 2000,     // Pour notifications informatives
  
  // Timeouts spécifiques
  RIDE_REQUEST_TIMEOUT: 30000, // 30 secondes pour répondre à une course
  DELIVERY_REQUEST_TIMEOUT: 25000, // 25 secondes pour livraison
  MARKETPLACE_ORDER_TIMEOUT: 60000, // 1 minute pour commande marketplace
  
  // Durées spéciales
  LOTTERY_NOTIFICATION_DURATION: 3000, // Notification loterie
  LOTTERY_ANIMATION_DURATION: 1000,    // Animation ticket
  CHALLENGE_NOTIFICATION_DURATION: 2500, // Notification défi
  
  // Durées des animations (en millisecondes)
  ANIMATION: {
    ENTRANCE_DURATION: 300,  // Animation d'entrée
    EXIT_DURATION: 300,      // Animation de sortie
    FADE_DURATION: 200,      // Fondu
  },
  
  // Configuration Sonner
  SONNER: {
    DEFAULT_DURATION: 2000,
    SUCCESS_DURATION: 2000,
    ERROR_DURATION: 2000,
    INFO_DURATION: 2000,
    WARNING_DURATION: 2000,
  },
  
  // Délais pour retry et autres opérations
  RETRY_INTERVALS: [1000, 3000, 5000, 10000, 20000], // Escalade progressive
  MAX_RETRIES: 5,
  
  // Types de priorité et leurs durées (étendues pour meilleure lisibilité)
  PRIORITY_DURATIONS: {
    low: 3000,      // 3 secondes - notifications informatives
    normal: 4000,   // 4 secondes - standard
    high: 6000,     // 6 secondes - important, temps de lecture
    urgent: 0       // Persistant - ne disparaît pas automatiquement
  },
  
  // Mapping événements → sons
  SOUND_MAPPING: {
    // Transport
    'transport.driver_assigned': 'driverAssigned',
    'transport.driver_arrived': 'driverArrived',
    'transport.in_progress': 'rideStarted',
    'transport.completed': 'deliveryCompleted',
    
    // Livraison
    'delivery.confirmed': 'orderConfirmed',
    'delivery.picked_up': 'deliveryPicked',
    'delivery.delivered': 'deliveryCompleted',
    
    // Marketplace
    'marketplace.new_order': 'newOrder',
    'marketplace.order_confirmed': 'orderConfirmed',
    'marketplace.payment': 'paymentReceived',
    'marketplace.product_approved': 'productApproved',
    'marketplace.product_rejected': 'productRejected',
    
    // Admin
    'admin.urgent': 'urgentAlert',
    'admin.warning': 'warning',
    'admin.error': 'error',
    'admin.success': 'success',
    
    // Chat
    'chat.message': 'message',
    
    // Défaut
    'default': 'general'
  } as const
} as const;

// Types dérivés pour TypeScript
export type NotificationDuration = typeof NOTIFICATION_CONFIG.DEFAULT_DURATION;
export type AnimationDuration = typeof NOTIFICATION_CONFIG.ANIMATION.EXIT_DURATION;
export type PriorityLevel = keyof typeof NOTIFICATION_CONFIG.PRIORITY_DURATIONS;

// Fonction utilitaire pour obtenir la durée selon la priorité
export const getDurationByPriority = (priority: PriorityLevel = 'normal'): number => {
  return NOTIFICATION_CONFIG.PRIORITY_DURATIONS[priority];
};

// Fonction utilitaire pour obtenir le son selon l'événement
export const getSoundForEvent = (eventKey: string): string => {
  return (NOTIFICATION_CONFIG.SOUND_MAPPING as any)[eventKey] || 'general';
};

// Validation des durées (ne doit pas dépasser 2 secondes)
export const validateNotificationDuration = (duration: number): number => {
  const MAX_ALLOWED_DURATION = 2000;
  return Math.min(duration, MAX_ALLOWED_DURATION);
};