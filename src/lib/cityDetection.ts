// Supported cities configuration with bounds and metadata
export const SUPPORTED_CITIES = {
  kinshasa: {
    name: 'Kinshasa',
    code: 'KIN',
    countryCode: 'CD',
    coordinates: { lat: -4.4419, lng: 15.2663 },
    bounds: {
      north: -4.2,
      south: -4.5,
      east: 15.5,
      west: 15.1
    },
    communes: ['Gombe', 'Barumbu', 'Kinshasa', 'Lingwala', 'Kintambo', 'Ngaliema', 'Mont-Ngafula', 'Selembao', 'Lemba', 'Limete', 'Matete', 'Ngaba', 'Makala', 'Bumbu', 'Ngiri-Ngiri', 'Kalamu', 'Bandalungwa', 'Kasa-Vubu', 'Masina', 'Ndjili', 'Kisenso', 'Maluku', 'Nsele'],
    timezone: 'Africa/Kinshasa',
    currency: 'XOF'
  },
  lubumbashi: {
    name: 'Lubumbashi',
    code: 'LBU',
    countryCode: 'CD',
    coordinates: { lat: -11.6876, lng: 27.5026 },
    bounds: {
      north: -11.5,
      south: -11.9,
      east: 27.7,
      west: 27.3
    },
    communes: ['Lubumbashi', 'Kenya', 'Kamalondo', 'Kampemba', 'Katuba', 'Rwashi', 'Annexe'],
    timezone: 'Africa/Lubumbashi',
    currency: 'XOF'
  },
  kolwezi: {
    name: 'Kolwezi',
    code: 'KWZ',
    countryCode: 'CD',
    coordinates: { lat: -10.7167, lng: 25.4667 },
    bounds: {
      north: -10.5,
      south: -10.9,
      east: 25.7,
      west: 25.2
    },
    communes: ['Kolwezi', 'Dilala', 'Manika'],
    timezone: 'Africa/Lubumbashi',
    currency: 'XOF'
  },
  abidjan: {
    name: 'Abidjan',
    code: 'ABJ',
    countryCode: 'CI',
    coordinates: { lat: 5.3600, lng: -4.0083 },
    bounds: {
      north: 5.6,
      south: 5.1,
      east: -3.7,
      west: -4.3
    },
    communes: ['Cocody', 'Plateau', 'Yopougon', 'Marcory', 'Treichville', 'Abobo', 'Adjamé', 'Koumassi', 'Port-Bouët', 'Attécoubé'],
    timezone: 'Africa/Abidjan',
    currency: 'XOF'
  },
};

export type CityKey = keyof typeof SUPPORTED_CITIES;
export type SupportedCity = typeof SUPPORTED_CITIES[CityKey];

/**
 * Detect city from coordinates
 */
export const detectCityFromCoordinates = (lat: number, lng: number): SupportedCity | null => {
  for (const [key, city] of Object.entries(SUPPORTED_CITIES)) {
    const { bounds } = city;
    if (lat <= bounds.north && lat >= bounds.south && lng <= bounds.east && lng >= bounds.west) {
      return city as SupportedCity;
    }
  }
  return null;
};

/**
 * Get city name from coordinates with fallback
 */
export const getCityNameFromCoordinates = (lat: number, lng: number, fallback = 'Kinshasa'): string => {
  const city = detectCityFromCoordinates(lat, lng);
  return city?.name || fallback;
};

/**
 * Get currency from coordinates
 */
export const getCurrencyFromCoordinates = (lat: number, lng: number): string => {
  const city = detectCityFromCoordinates(lat, lng);
  return city?.currency || 'XOF';
};

/**
 * Check if coordinates are in a supported city
 */
export const isInSupportedCity = (lat: number, lng: number): boolean => {
  return detectCityFromCoordinates(lat, lng) !== null;
};

/**
 * Get all supported city names
 */
export const getSupportedCityNames = (): string[] => {
  return Object.values(SUPPORTED_CITIES).map(city => city.name);
};

/**
 * Find city by name (case-insensitive)
 */
export const findCityByName = (name: string): SupportedCity | null => {
  const normalizedName = name.toLowerCase().trim();
  for (const city of Object.values(SUPPORTED_CITIES)) {
    if (city.name.toLowerCase() === normalizedName) {
      return city as SupportedCity;
    }
    // Check if name matches any commune
    if (city.communes.some(c => c.toLowerCase() === normalizedName)) {
      return city as SupportedCity;
    }
  }
  return null;
};
