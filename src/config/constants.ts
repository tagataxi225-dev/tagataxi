/**
 * 🔧 CONSTANTES GLOBALES DE L'APPLICATION KWENDA
 * Centralisé pour faciliter la maintenance et les mises à jour
 */

// ============================================
// 📞 SUPPORT & CONTACT
// ============================================
export const SUPPORT_PHONE = '+243 858 040 400';
export const SUPPORT_PHONE_RAW = '+243858040400';
export const EMERGENCY_PHONE = '+243 999 999 999';
export const SUPPORT_EMAIL = 'support@tagago.app';
export const SUPPORT_HOURS = '24h/7j';

// ============================================
// 🌍 CONFIGURATION PAYS/VILLES
// ============================================
export const DEFAULT_COUNTRY = 'RDC';
export const DEFAULT_CITY = 'Kinshasa';
export const DEFAULT_CURRENCY = 'XOF';

export const SUPPORTED_CITIES = [
  'Kinshasa',
  'Lubumbashi',
  'Kolwezi'
] as const;

// ============================================
// 💰 TARIFICATION
// ============================================
export const MIN_WALLET_BALANCE = 1000; // CDF
export const MIN_WITHDRAWAL_AMOUNT = 5000; // CDF

// ============================================
// 🚗 TRANSPORT
// ============================================
export const DRIVER_SEARCH_RADIUS_KM = 5;
export const MAX_DRIVER_SEARCH_RADIUS_KM = 15;
export const BOOKING_TIMEOUT_MINUTES = 10;

// ============================================
// 📦 LIVRAISON
// ============================================
export const DELIVERY_TYPES = {
  FLASH: 'flash',
  FLEX: 'flex',
  MAXICHARGE: 'maxicharge'
} as const;

// ============================================
// 🎫 LOTERIE
// ============================================
export const LOTTERY_TICKET_PRICE = 0; // Gratuit via actions
export const LOTTERY_DRAW_HOUR = 20; // 20h chaque jour

// ============================================
// 📱 FORMATS & VALIDATION
// ============================================
export const PHONE_REGEX = /^\+243[0-9]{9}$/;
export const PHONE_PLACEHOLDER = '+243 XXX XXX XXX';
export const LICENSE_PLATE_REGEX = /^[A-Z0-9-]{5,15}$/;

// ============================================
// ⏱️ DÉLAIS & TIMEOUTS
// ============================================
export const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
export const LOCATION_UPDATE_INTERVAL_MS = 30 * 1000; // 30 secondes
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// ============================================
// 🎨 LIMITES UI
// ============================================
export const MAX_UPLOAD_SIZE_MB = 5;
export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_DESCRIPTION_LENGTH = 500;
export const ITEMS_PER_PAGE = 20;

export default {
  SUPPORT_PHONE,
  SUPPORT_PHONE_RAW,
  EMERGENCY_PHONE,
  SUPPORT_EMAIL,
  SUPPORT_HOURS,
  DEFAULT_COUNTRY,
  DEFAULT_CITY,
  DEFAULT_CURRENCY,
  SUPPORTED_CITIES,
  PHONE_REGEX,
  PHONE_PLACEHOLDER
};
