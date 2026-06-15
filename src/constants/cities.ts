const isInAbidjan = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Africa/Abidjan';

export const SUPPORTED_CITIES = [
  { value: 'Kinshasa', label: '🇨🇩 Kinshasa', emoji: '🇨🇩' },
  { value: 'Lubumbashi', label: '🇨🇩 Lubumbashi', emoji: '🇨🇩' },
  { value: 'Kolwezi', label: '🇨🇩 Kolwezi', emoji: '🇨🇩' },
  ...(isInAbidjan ? [{ value: 'Abidjan', label: '🇨🇮 Abidjan', emoji: '🇨🇮' }] : []),
];

export type CityValue = 'Kinshasa' | 'Lubumbashi' | 'Kolwezi' | 'Abidjan';
