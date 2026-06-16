/**
 * Utilitaires de formatage des devises pour l'application Tembea
 * Détection automatique CDF (RDC) / XOF (Côte d'Ivoire et autres pays UEMOA) via timezone.
 */

export type Currency = 'XOF' | 'XOF';

// Détection au chargement du module (une seule fois)
const _tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
const _xofZones = ['Abidjan', 'Dakar', 'Accra', 'Bamako', 'Conakry', 'Bissau', 'Lome', 'Cotonou', 'Niamey', 'Ouagadougou'];
export const detectedCurrency: Currency = _xofZones.some(z => _tz.includes(z)) ? 'XOF' : 'XOF';

export const formatCurrency = (amount: number, currency: Currency = detectedCurrency): string => {
  return `${amount.toLocaleString('fr-FR')} ${currency}`;
};

export const formatCurrencyCompact = (amount: number, currency: Currency = detectedCurrency): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M ${currency}`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K ${currency}`;
  }
  return `${amount} ${currency}`;
};

export const getCurrencyByCity = (city: string): Currency => {
  if (city?.toLowerCase().includes('abidjan')) return 'XOF';
  return 'XOF';
};

/**
 * Fonction raccourcie pour formater en CDF (force CDF, ignore détection)
 */
export const formatCDF = (amount: number): string => {
  return formatCurrency(amount, 'XOF');
};

/**
 * Détecte la devise selon la ville passée en paramètre.
 * Si pas de ville → utilise la détection timezone.
 */
export const formatPrice = (amount: number, city?: string): string => {
  const currency = city ? getCurrencyByCity(city) : detectedCurrency;
  return formatCurrency(amount, currency);
};
