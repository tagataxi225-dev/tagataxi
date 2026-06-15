export interface ZonePolygon {
  type: 'Polygon';
  coordinates: number[][][]; // [lng, lat] pairs
}

export interface ServiceZone {
  id: string;
  name: string;
  nameEn: string;
  nameFr: string;
  type: 'commune' | 'district' | 'quartier';
  center: [number, number]; // [lng, lat]
  polygon: ZonePolygon;
  isActive: boolean;
  surgeMultiplier: number;
  popularPlaces: PopularPlace[];
}

export interface PopularPlace {
  id: string;
  name: string;
  nameEn: string;
  nameFr: string;
  category: 'hospital' | 'school' | 'market' | 'office' | 'hotel' | 'restaurant' | 'transport' | 'landmark';
  coordinates: [number, number]; // [lng, lat]
  address: string;
  zone: string;
}

export class ZoneService {
  private static zones: ServiceZone[] = [
    // KINSHASA - RDC
    {
      id: 'gombe_kinshasa',
      name: 'Gombe',
      nameEn: 'Gombe',
      nameFr: 'Gombe',
      type: 'commune',
      center: [15.2663, -4.3319],
      polygon: {
        type: 'Polygon',
        coordinates: [[
          [15.2450, -4.3100], [15.2850, -4.3100], 
          [15.2850, -4.3500], [15.2450, -4.3500], 
          [15.2450, -4.3100]
        ]]
      },
      isActive: true,
      surgeMultiplier: 1.4,
      popularPlaces: [
        {
          id: 'hopital_general_kinshasa',
          name: 'Hôpital Général de Kinshasa',
          nameEn: 'Kinshasa General Hospital',
          nameFr: 'Hôpital Général de Kinshasa',
          category: 'hospital',
          coordinates: [15.2750, -4.3250],
          address: 'Avenue de la Justice, Gombe',
          zone: 'gombe_kinshasa'
        }
      ]
    },
    {
      id: 'lemba_kinshasa',
      name: 'Lemba',
      nameEn: 'Lemba',
      nameFr: 'Lemba',
      type: 'commune',
      center: [15.2441, -4.4286],
      polygon: {
        type: 'Polygon',
        coordinates: [[
          [15.2200, -4.4000], [15.2700, -4.4000],
          [15.2700, -4.4600], [15.2200, -4.4600],
          [15.2200, -4.4000]
        ]]
      },
      isActive: true,
      surgeMultiplier: 1.0,
      popularPlaces: [
        {
          id: 'universite_kinshasa',
          name: 'Université de Kinshasa',
          nameEn: 'University of Kinshasa',
          nameFr: 'Université de Kinshasa',
          category: 'school',
          coordinates: [15.2350, -4.4350],
          address: 'Campus Universitaire, Lemba',
          zone: 'lemba_kinshasa'
        }
      ]
    },
    
    // LUBUMBASHI - RDC
    {
      id: 'kenya_lubumbashi',
      name: 'Kenya',
      nameEn: 'Kenya',
      nameFr: 'Kenya',
      type: 'commune',
      center: [27.4790, -11.6550],
      polygon: {
        type: 'Polygon',
        coordinates: [[
          [27.4600, -11.6700], [27.4980, -11.6700],
          [27.4980, -11.6400], [27.4600, -11.6400],
          [27.4600, -11.6700]
        ]]
      },
      isActive: true,
      surgeMultiplier: 1.2,
      popularPlaces: [
        {
          id: 'universite_lubumbashi',
          name: 'Université de Lubumbashi',
          nameEn: 'University of Lubumbashi',
          nameFr: 'Université de Lubumbashi',
          category: 'school',
          coordinates: [27.4800, -11.6600],
          address: 'Campus Universitaire, Kenya',
          zone: 'kenya_lubumbashi'
        }
      ]
    },
    {
      id: 'kampemba_lubumbashi',
      name: 'Kampemba',
      nameEn: 'Kampemba',
      nameFr: 'Kampemba',
      type: 'commune',
      center: [27.4300, -11.6800],
      polygon: {
        type: 'Polygon',
        coordinates: [[
          [27.4100, -11.7000], [27.4500, -11.7000],
          [27.4500, -11.6600], [27.4100, -11.6600],
          [27.4100, -11.7000]
        ]]
      },
      isActive: true,
      surgeMultiplier: 1.0,
      popularPlaces: [
        {
          id: 'marche_kampemba',
          name: 'Marché de Kampemba',
          nameEn: 'Kampemba Market',
          nameFr: 'Marché de Kampemba',
          category: 'market',
          coordinates: [27.4400, -11.6900],
          address: 'Avenue Kampemba',
          zone: 'kampemba_lubumbashi'
        }
      ]
    },
    
    // KOLWEZI - RDC
    {
      id: 'centre_kolwezi',
      name: 'Centre-ville',
      nameEn: 'Downtown',
      nameFr: 'Centre-ville',
      type: 'commune',
      center: [25.4667, -10.7167],
      polygon: {
        type: 'Polygon',
        coordinates: [[
          [25.4500, -10.7300], [25.4800, -10.7300],
          [25.4800, -10.7000], [25.4500, -10.7000],
          [25.4500, -10.7300]
        ]]
      },
      isActive: true,
      surgeMultiplier: 1.1,
      popularPlaces: [
        {
          id: 'hotel_kolwezi',
          name: 'Hôtel de Kolwezi',
          nameEn: 'Kolwezi Hotel',
          nameFr: 'Hôtel de Kolwezi',
          category: 'hotel',
          coordinates: [25.4700, -10.7200],
          address: 'Centre-ville, Kolwezi',
          zone: 'centre_kolwezi'
        }
      ]
    }
  ];

  static getZones(): ServiceZone[] {
    return this.zones.filter(zone => zone.isActive);
  }

  static getZoneByPoint(lng: number, lat: number): ServiceZone | null {
    for (const zone of this.zones) {
      if (this.isPointInZone(lng, lat, zone)) {
        return zone;
      }
    }
    return null;
  }

  static getZoneById(id: string): ServiceZone | null {
    return this.zones.find(zone => zone.id === id) || null;
  }

  static getPopularPlacesInZone(zoneId: string): PopularPlace[] {
    const zone = this.getZoneById(zoneId);
    return zone ? zone.popularPlaces : [];
  }

  static getAllPopularPlaces(): PopularPlace[] {
    return this.zones.flatMap(zone => zone.popularPlaces);
  }

  static searchPopularPlaces(query: string, limit = 5): PopularPlace[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    const places = this.getAllPopularPlaces();
    const matches = places.filter(place => 
      place.name.toLowerCase().includes(normalizedQuery) ||
      place.nameEn.toLowerCase().includes(normalizedQuery) ||
      place.nameFr.toLowerCase().includes(normalizedQuery) ||
      place.address.toLowerCase().includes(normalizedQuery)
    );

    return matches.slice(0, limit);
  }

  static getProximityBias(userLng: number, userLat: number): { lng: number; lat: number } | null {
    const zone = this.getZoneByPoint(userLng, userLat);
    if (zone) {
      return { lng: zone.center[0], lat: zone.center[1] };
    }
    
    // Default to Kinshasa center if no zone found
    return { lng: 15.2663, lat: -4.3319 };
  }

  static getSurgeMultiplier(lng: number, lat: number): number {
    const zone = this.getZoneByPoint(lng, lat);
    return zone ? zone.surgeMultiplier : 1.0;
  }

  private static isPointInZone(lng: number, lat: number, zone: ServiceZone): boolean {
    // Simple bounding box check for performance
    const coords = zone.polygon.coordinates[0];
    const minLng = Math.min(...coords.map(c => c[0]));
    const maxLng = Math.max(...coords.map(c => c[0]));
    const minLat = Math.min(...coords.map(c => c[1]));
    const maxLat = Math.max(...coords.map(c => c[1]));

    return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
  }

  static getNearbyZones(lng: number, lat: number, radiusKm = 10): ServiceZone[] {
    return this.zones.filter(zone => {
      const distance = this.calculateDistance(
        lat, lng,
        zone.center[1], zone.center[0]
      );
      return distance <= radiusKm;
    });
  }

  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  static getZoneStatistics() {
    return {
      totalZones: this.zones.length,
      activeZones: this.zones.filter(z => z.isActive).length,
      totalPopularPlaces: this.getAllPopularPlaces().length,
      zonesByType: {
        commune: this.zones.filter(z => z.type === 'commune').length,
        district: this.zones.filter(z => z.type === 'district').length,
        quartier: this.zones.filter(z => z.type === 'quartier').length,
      }
    };
  }
}