export interface City {
  name: string;
  coordinates: { lat: number; lng: number };
}

export interface TransportType {
  id: string;
  name: string;
  type: 'taxi' | 'bus' | 'moto' | 'car' | 'shared';
  baseFare: number;
  perKmRate: number;
  capacity: number;
  availability: boolean;
  features: string[];
  description: string;
}

export interface CountryConfig {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  language: string;
  timezone: string;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  majorCities: City[];
  transportTypes: TransportType[];
  addressFormat: {
    format: string;
    components: string[];
  };
  mapboxCountryCode: string;
  defaultProximity?: { lat: number; lng: number };
}

// Country configurations - Extended worldwide coverage
const COUNTRIES: Record<string, CountryConfig> = {
  // Global fallback
  "*": {
    code: "*",
    name: "Monde",
    currency: "USD",
    currencySymbol: "$",
    language: "en",
    timezone: "UTC",
    bbox: [-180, -90, 180, 90],
    mapboxCountryCode: "",
    majorCities: [
      { name: 'London', coordinates: { lat: 51.5074, lng: -0.1278 } },
      { name: 'New York', coordinates: { lat: 40.7128, lng: -74.0060 } },
      { name: 'Tokyo', coordinates: { lat: 35.6762, lng: 139.6503 } },
      { name: 'Paris', coordinates: { lat: 48.8566, lng: 2.3522 } },
      { name: 'Sydney', coordinates: { lat: -33.8688, lng: 151.2093 } }
    ],
    defaultProximity: { lat: 48.8566, lng: 2.3522 },
    transportTypes: [],
    addressFormat: {
      format: '{street}, {city}, {country}',
      components: ['street', 'city', 'country']
    }
  },

  // Africa
  CI: {
    code: 'CI',
    name: 'Côte d\'Ivoire',
    currency: 'XOF',
    currencySymbol: 'CFA',
    language: 'fr',
    timezone: 'Africa/Abidjan',
    bbox: [-8.5, 4.0, -2.5, 10.5],
    mapboxCountryCode: 'ci',
    majorCities: [
      { name: 'Abidjan', coordinates: { lat: 5.3364, lng: -4.0267 } },
      { name: 'Yamoussoukro', coordinates: { lat: 6.8276, lng: -5.2893 } },
      { name: 'Bouaké', coordinates: { lat: 7.6843, lng: -5.0295 } },
      { name: 'San Pedro', coordinates: { lat: 4.7369, lng: -6.6361 } },
      { name: 'Korhogo', coordinates: { lat: 9.4580, lng: -5.6297 } }
    ],
    defaultProximity: { lat: 5.3364, lng: -4.0267 },
    transportTypes: [
      {
        id: 'woro-woro',
        name: 'Wôrô-wôrô',
        type: 'shared',
        baseFare: 200,
        perKmRate: 100,
        capacity: 18,
        availability: true,
        features: ['Économique', 'Partagé', 'Lignes fixes'],
        description: 'Transport en commun traditionnel d\'Abidjan'
      },
      {
        id: 'taxi-compteur',
        name: 'Taxi compteur',
        type: 'taxi',
        baseFare: 1000,
        perKmRate: 500,
        capacity: 4,
        availability: true,
        features: ['Climatisé', 'Compteur', 'Privé'],
        description: 'Taxi officiel avec compteur'
      },
      {
        id: 'moto-taxi',
        name: 'Moto-taxi',
        type: 'moto',
        baseFare: 300,
        perKmRate: 200,
        capacity: 1,
        availability: true,
        features: ['Rapide', 'Économique', 'Trafic'],
        description: 'Transport rapide en moto'
      }
    ],
    addressFormat: {
      format: '{street}, {district}, {city}',
      components: ['street', 'district', 'city', 'country']
    }
  },

  CD: {
    code: 'CD',
    name: 'République Démocratique du Congo',
    currency: 'CDF',
    currencySymbol: 'FC',
    language: 'fr',
    timezone: 'Africa/Kinshasa',
    bbox: [12.0, -13.0, 31.0, 5.5],
    mapboxCountryCode: 'cd',
    majorCities: [
      { name: 'Kinshasa', coordinates: { lat: -4.4419, lng: 15.2663 } },
      { name: 'Lubumbashi', coordinates: { lat: -11.6609, lng: 27.4794 } },
      { name: 'Mbuji-Mayi', coordinates: { lat: -6.1364, lng: 23.5886 } },
      { name: 'Kisangani', coordinates: { lat: 0.5167, lng: 25.2167 } },
      { name: 'Kolwezi', coordinates: { lat: -10.7143, lng: 25.4731 } },
      { name: 'Bukavu', coordinates: { lat: -2.5081, lng: 28.8473 } },
      { name: 'Goma', coordinates: { lat: -1.6792, lng: 29.2228 } }
    ],
    defaultProximity: { lat: -4.4419, lng: 15.2663 },
    transportTypes: [
      {
        id: 'taxi-bus',
        name: 'Taxi-bus',
        type: 'shared',
        baseFare: 300,
        perKmRate: 150,
        capacity: 20,
        availability: true,
        features: ['Économique', 'Partagé', 'Urbain'],
        description: 'Transport en commun de Kinshasa'
      },
      {
        id: 'moto-taxi',
        name: 'Moto-taxi',
        type: 'moto',
        baseFare: 200,
        perKmRate: 100,
        capacity: 1,
        availability: true,
        features: ['Rapide', 'Économique', 'Flexible'],
        description: 'Transport rapide en moto'
      }
    ],
    addressFormat: {
      format: '{street}, {commune}, {city}',
      components: ['street', 'commune', 'city', 'country']
    }
  },

  // Europe
  FR: {
    code: 'FR',
    name: 'France',
    currency: 'EUR',
    currencySymbol: '€',
    language: 'fr',
    timezone: 'Europe/Paris',
    bbox: [-5.0, 42.0, 9.0, 51.0],
    mapboxCountryCode: 'fr',
    majorCities: [
      { name: 'Paris', coordinates: { lat: 48.8566, lng: 2.3522 } },
      { name: 'Lyon', coordinates: { lat: 45.7640, lng: 4.8357 } },
      { name: 'Marseille', coordinates: { lat: 43.2965, lng: 5.3698 } },
      { name: 'Toulouse', coordinates: { lat: 43.6047, lng: 1.4442 } },
      { name: 'Nice', coordinates: { lat: 43.7102, lng: 7.2620 } },
      { name: 'Bordeaux', coordinates: { lat: 44.8378, lng: -0.5792 } }
    ],
    defaultProximity: { lat: 48.8566, lng: 2.3522 },
    transportTypes: [
      {
        id: 'taxi',
        name: 'Taxi',
        type: 'taxi',
        baseFare: 700,
        perKmRate: 150,
        capacity: 4,
        availability: true,
        features: ['Confort', 'Rapide', 'Disponible 24h/7'],
        description: 'Taxi traditionnel français'
      },
      {
        id: 'vtc',
        name: 'VTC',
        type: 'car',
        baseFare: 500,
        perKmRate: 120,
        capacity: 4,
        availability: true,
        features: ['Réservation', 'Confort', 'Prix fixe'],
        description: 'Véhicule de transport avec chauffeur'
      }
    ],
    addressFormat: {
      format: '{number} {street}, {postalCode} {city}',
      components: ['number', 'street', 'postalCode', 'city', 'country']
    }
  },

  GB: {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    language: 'en',
    timezone: 'Europe/London',
    bbox: [-8.5, 49.8, 2.0, 60.9],
    mapboxCountryCode: 'gb',
    majorCities: [
      { name: 'London', coordinates: { lat: 51.5074, lng: -0.1278 } },
      { name: 'Manchester', coordinates: { lat: 53.4808, lng: -2.2426 } },
      { name: 'Birmingham', coordinates: { lat: 52.4862, lng: -1.8904 } },
      { name: 'Liverpool', coordinates: { lat: 53.4084, lng: -2.9916 } },
      { name: 'Edinburgh', coordinates: { lat: 55.9533, lng: -3.1883 } }
    ],
    defaultProximity: { lat: 51.5074, lng: -0.1278 },
    transportTypes: [],
    addressFormat: {
      format: '{number} {street}, {city}, {postcode}',
      components: ['number', 'street', 'city', 'postcode', 'country']
    }
  },

  DE: {
    code: 'DE',
    name: 'Germany',
    currency: 'EUR',
    currencySymbol: '€',
    language: 'de',
    timezone: 'Europe/Berlin',
    bbox: [5.9, 47.3, 15.0, 55.1],
    mapboxCountryCode: 'de',
    majorCities: [
      { name: 'Berlin', coordinates: { lat: 52.5200, lng: 13.4050 } },
      { name: 'Munich', coordinates: { lat: 48.1351, lng: 11.5820 } },
      { name: 'Hamburg', coordinates: { lat: 53.5511, lng: 9.9937 } },
      { name: 'Frankfurt', coordinates: { lat: 50.1109, lng: 8.6821 } },
      { name: 'Cologne', coordinates: { lat: 50.9375, lng: 6.9603 } }
    ],
    defaultProximity: { lat: 52.5200, lng: 13.4050 },
    transportTypes: [],
    addressFormat: {
      format: '{street} {number}, {postalCode} {city}',
      components: ['street', 'number', 'postalCode', 'city', 'country']
    }
  },

  // Americas
  US: {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    language: 'en',
    timezone: 'America/New_York',
    bbox: [-125.0, 25.0, -66.0, 49.0],
    mapboxCountryCode: 'us',
    majorCities: [
      { name: 'New York', coordinates: { lat: 40.7128, lng: -74.0060 } },
      { name: 'Los Angeles', coordinates: { lat: 34.0522, lng: -118.2437 } },
      { name: 'Chicago', coordinates: { lat: 41.8781, lng: -87.6298 } },
      { name: 'Houston', coordinates: { lat: 29.7604, lng: -95.3698 } },
      { name: 'Miami', coordinates: { lat: 25.7617, lng: -80.1918 } },
      { name: 'San Francisco', coordinates: { lat: 37.7749, lng: -122.4194 } }
    ],
    defaultProximity: { lat: 40.7128, lng: -74.0060 },
    transportTypes: [
      {
        id: 'taxi',
        name: 'Taxi',
        type: 'taxi',
        baseFare: 250,
        perKmRate: 200,
        capacity: 4,
        availability: true,
        features: ['Licensed', '24/7', 'Metered'],
        description: 'Traditional yellow cab'
      },
      {
        id: 'rideshare',
        name: 'Rideshare',
        type: 'car',
        baseFare: 200,
        perKmRate: 150,
        capacity: 4,
        availability: true,
        features: ['App-based', 'Upfront pricing', 'Tracking'],
        description: 'Uber/Lyft style service'
      }
    ],
    addressFormat: {
      format: '{number} {street}, {city}, {state} {zip}',
      components: ['number', 'street', 'city', 'state', 'zip', 'country']
    }
  },

  CA: {
    code: 'CA',
    name: 'Canada',
    currency: 'CAD',
    currencySymbol: 'C$',
    language: 'en',
    timezone: 'America/Toronto',
    bbox: [-141.0, 41.7, -52.6, 83.1],
    mapboxCountryCode: 'ca',
    majorCities: [
      { name: 'Toronto', coordinates: { lat: 43.6532, lng: -79.3832 } },
      { name: 'Vancouver', coordinates: { lat: 49.2827, lng: -123.1207 } },
      { name: 'Montreal', coordinates: { lat: 45.5017, lng: -73.5673 } },
      { name: 'Calgary', coordinates: { lat: 51.0447, lng: -114.0719 } },
      { name: 'Ottawa', coordinates: { lat: 45.4215, lng: -75.6972 } }
    ],
    defaultProximity: { lat: 43.6532, lng: -79.3832 },
    transportTypes: [],
    addressFormat: {
      format: '{number} {street}, {city}, {province} {postalCode}',
      components: ['number', 'street', 'city', 'province', 'postalCode', 'country']
    }
  },

  // Asia
  JP: {
    code: 'JP',
    name: 'Japan',
    currency: 'JPY',
    currencySymbol: '¥',
    language: 'ja',
    timezone: 'Asia/Tokyo',
    bbox: [129.0, 31.0, 146.0, 46.0],
    mapboxCountryCode: 'jp',
    majorCities: [
      { name: 'Tokyo', coordinates: { lat: 35.6762, lng: 139.6503 } },
      { name: 'Osaka', coordinates: { lat: 34.6937, lng: 135.5023 } },
      { name: 'Kyoto', coordinates: { lat: 35.0116, lng: 135.7681 } },
      { name: 'Yokohama', coordinates: { lat: 35.4437, lng: 139.6380 } },
      { name: 'Nagoya', coordinates: { lat: 35.1815, lng: 136.9066 } }
    ],
    defaultProximity: { lat: 35.6762, lng: 139.6503 },
    transportTypes: [],
    addressFormat: {
      format: '{prefecture} {city} {district} {number}',
      components: ['prefecture', 'city', 'district', 'number', 'country']
    }
  },

  CN: {
    code: 'CN',
    name: 'China',
    currency: 'CNY',
    currencySymbol: '¥',
    language: 'zh',
    timezone: 'Asia/Shanghai',
    bbox: [73.6, 18.2, 135.0, 53.6],
    mapboxCountryCode: 'cn',
    majorCities: [
      { name: 'Beijing', coordinates: { lat: 39.9042, lng: 116.4074 } },
      { name: 'Shanghai', coordinates: { lat: 31.2304, lng: 121.4737 } },
      { name: 'Guangzhou', coordinates: { lat: 23.1291, lng: 113.2644 } },
      { name: 'Shenzhen', coordinates: { lat: 22.5431, lng: 114.0579 } },
      { name: 'Chengdu', coordinates: { lat: 30.5728, lng: 104.0668 } }
    ],
    defaultProximity: { lat: 39.9042, lng: 116.4074 },
    transportTypes: [],
    addressFormat: {
      format: '{province} {city} {district} {street} {number}',
      components: ['province', 'city', 'district', 'street', 'number', 'country']
    }
  },

  // Oceania
  AU: {
    code: 'AU',
    name: 'Australia',
    currency: 'AUD',
    currencySymbol: 'A$',
    language: 'en',
    timezone: 'Australia/Sydney',
    bbox: [113.3, -43.6, 153.6, -10.7],
    mapboxCountryCode: 'au',
    majorCities: [
      { name: 'Sydney', coordinates: { lat: -33.8688, lng: 151.2093 } },
      { name: 'Melbourne', coordinates: { lat: -37.8136, lng: 144.9631 } },
      { name: 'Brisbane', coordinates: { lat: -27.4698, lng: 153.0251 } },
      { name: 'Perth', coordinates: { lat: -31.9505, lng: 115.8605 } },
      { name: 'Adelaide', coordinates: { lat: -34.9285, lng: 138.6007 } }
    ],
    defaultProximity: { lat: -33.8688, lng: 151.2093 },
    transportTypes: [],
    addressFormat: {
      format: '{number} {street}, {suburb} {state} {postcode}',
      components: ['number', 'street', 'suburb', 'state', 'postcode', 'country']
    }
  }
};

export class CountryService {
  private static currentCountry: CountryConfig = COUNTRIES.CD; // Default to RDC
  private static listeners: Array<(country: CountryConfig) => void> = [];

  static getCurrentCountry(): CountryConfig {
    return this.currentCountry;
  }

  static setCurrentCountry(countryCode: string): void {
    const upperCode = countryCode.toUpperCase();
    
    // Prioritize CI and CD, but allow any country for global reach
    let country = COUNTRIES[upperCode];
    
    // If not CI/CD, use global fallback but keep CI/CD features
    if (!country && upperCode !== 'UNKNOWN') {
      console.log(`Using global config for country: ${upperCode}`);
      country = { ...COUNTRIES["*"], code: upperCode };
    }
    
    if (country) {
      this.currentCountry = country;
      this.listeners.forEach(callback => callback(country));
    }
  }

  static onCountryChange(callback: (country: CountryConfig) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  static autoDetectAndSetCountry(latitude: number, longitude: number): void {
    const detectedCountry = this.detectCountryFromCoordinates(latitude, longitude);
    if (detectedCountry) {
      this.setCurrentCountry(detectedCountry.code);
    } else {
      // Don't force CD, let the IP geolocation or user choice handle it
      console.log('Could not detect country from coordinates, using current location data');
    }
  }

  private static detectCountryFromCoordinates(latitude: number, longitude: number): CountryConfig | null {
    // Check all available countries, prioritizing CI and CD
    const priorityCountries = ['CI', 'CD'];
    const allCountries = Object.keys(COUNTRIES).filter(code => code !== '*');
    
    // Check priority countries first
    for (const countryCode of priorityCountries) {
      const country = COUNTRIES[countryCode];
      if (!country) continue;
      
      const [minLng, minLat, maxLng, maxLat] = country.bbox;
      if (latitude >= minLat && latitude <= maxLat && 
          longitude >= minLng && longitude <= maxLng) {
        return country;
      }
    }
    
    // Then check other countries
    for (const countryCode of allCountries) {
      if (priorityCountries.includes(countryCode)) continue;
      
      const country = COUNTRIES[countryCode];
      if (!country) continue;
      
      const [minLng, minLat, maxLng, maxLat] = country.bbox;
      if (latitude >= minLat && latitude <= maxLat && 
          longitude >= minLng && longitude <= maxLng) {
        return country;
      }
    }
    
    return null;
  }

  static getAllCountries(): CountryConfig[] {
    // Only return CI and RDC for Tembea
    return [COUNTRIES.CI, COUNTRIES.CD];
  }

  static getCountryByCode(code: string): CountryConfig | null {
    // Only allow CI and RDC (convert to uppercase)
    const upperCode = code.toUpperCase();
    if (upperCode === 'CI' || upperCode === 'CD') {
      return COUNTRIES[upperCode] || null;
    }
    return null;
  }

  static findNearestCity(latitude: number, longitude: number): City | null {
    const currentCountry = this.getCurrentCountry();
    
    // Search within current country first
    let nearestCity = this.findNearestCityInCountry(latitude, longitude, currentCountry);
    
    // If not found, search in the other CI-RDC country
    if (!nearestCity) {
      const otherCountryCode = currentCountry.code === 'CI' ? 'CD' : 'CI';
      const otherCountry = this.getCountryByCode(otherCountryCode);
      if (otherCountry) {
        nearestCity = this.findNearestCityInCountry(latitude, longitude, otherCountry);
      }
    }
    
    return nearestCity;
  }

  private static findNearestCityInCountry(latitude: number, longitude: number, country: CountryConfig): City | null {
    let nearestCity: City | null = null;
    let minDistance = Infinity;

    for (const city of country.majorCities) {
      const distance = this.calculateDistance(latitude, longitude, city.coordinates.lat, city.coordinates.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }

    return nearestCity;
  }

  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Helper methods for Tembea CI-RDC
  static isInCoteDIvoire(latitude: number, longitude: number): boolean {
    const ci = COUNTRIES.CI;
    const [minLng, minLat, maxLng, maxLat] = ci.bbox;
    return latitude >= minLat && latitude <= maxLat && longitude >= minLng && longitude <= maxLng;
  }

  static isInRDC(latitude: number, longitude: number): boolean {
    const cd = COUNTRIES.CD;
    const [minLng, minLat, maxLng, maxLat] = cd.bbox;
    return latitude >= minLat && latitude <= maxLat && longitude >= minLng && longitude <= maxLng;
  }

  static getDefaultCenter(): [number, number] {
    // Return Kinshasa coordinates as default
    return [15.2663, -4.4419];
  }
}