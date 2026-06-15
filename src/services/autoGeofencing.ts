import { supabase } from '@/integrations/supabase/client'

interface Zone {
  id: string
  name: string
  coordinates: any
  base_price_multiplier: number
  status: string
}

interface Location {
  latitude: number
  longitude: number
}

class AutoGeofencingService {
  private zones: Zone[] = []
  private initialized = false

  async initialize() {
    if (this.initialized) return

    try {
      const { data: zones } = await supabase
        .from('service_zones')
        .select('*')
        .eq('status', 'active')

      this.zones = zones || []
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize geofencing service:', error)
    }
  }

  /**
   * Détecte automatiquement la zone pour une position donnée
   */
  async detectZone(location: Location): Promise<Zone | null> {
    await this.initialize()

    for (const zone of this.zones) {
      if (this.isPointInZone(location, zone)) {
        return zone
      }
    }

    return null
  }

  /**
   * Obtient toutes les zones actives
   */
  async getActiveZones(): Promise<Zone[]> {
    await this.initialize()
    return this.zones
  }

  /**
   * Calcule le multiplicateur de prix pour une zone
   */
  async getPriceMultiplier(location: Location): Promise<number> {
    const zone = await this.detectZone(location)
    return zone?.base_price_multiplier || 1.0
  }

  /**
   * Vérifie si un point est dans un polygone (zone)
   */
  private isPointInZone(location: Location, zone: Zone): boolean {
    if (!zone.coordinates || !Array.isArray(zone.coordinates)) {
      return false
    }

    return this.pointInPolygon(location, zone.coordinates)
  }

  /**
   * Algorithme ray-casting pour déterminer si un point est dans un polygone
   */
  private pointInPolygon(point: Location, polygon: number[][]): boolean {
    const { latitude: lat, longitude: lng } = point
    let inside = false

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i]
      const [xj, yj] = polygon[j]

      if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
        inside = !inside
      }
    }

    return inside
  }

  /**
   * Met à jour les zones depuis la base de données
   */
  async refreshZones() {
    this.initialized = false
    await this.initialize()
  }

  /**
   * Obtient les chauffeurs disponibles dans une zone
   */
  async getAvailableDriversInZone(zoneId: string): Promise<any[]> {
    try {
      const { data: drivers } = await supabase
        .from('driver_locations')
        .select(`
          driver_id,
          latitude,
          longitude,
          is_online,
          is_available,
          last_ping,
          driver_profiles (
            user_id,
            service_type,
            rating_average,
            total_rides
          )
        `)
        .eq('is_online', true)
        .eq('is_available', true)
        .gte('last_ping', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Last 10 minutes

      if (!drivers) return []

      // Filtrer les chauffeurs dans la zone spécifiée
      const zone = this.zones.find(z => z.id === zoneId)
      if (!zone) return drivers

      return drivers.filter(driver => 
        this.isPointInZone(
          { latitude: driver.latitude, longitude: driver.longitude },
          zone
        )
      )
    } catch (error) {
      console.error('Error fetching drivers in zone:', error)
      return []
    }
  }

  /**
   * Calcule les statistiques temps réel pour une zone
   */
  async calculateZoneStats(zoneId: string) {
    try {
      // Appeler la fonction de calcul des statistiques de zone
      const { data, error } = await supabase.rpc('calculate_zone_statistics', {
        zone_id_param: zoneId
      })

      if (error) throw error
      
      return data
    } catch (error) {
      console.error('Error calculating zone stats:', error)
      return null
    }
  }

  /**
   * Obtient les prix dynamiques pour une zone
   */
  async getDynamicPricing(zoneId: string, vehicleClass: string = 'standard') {
    try {
      const { data, error } = await supabase.rpc('get_zone_pricing', {
        zone_id_param: zoneId,
        vehicle_class_param: vehicleClass
      })

      if (error) throw error
      
      return data?.[0] || null
    } catch (error) {
      console.error('Error getting dynamic pricing:', error)
      return null
    }
  }
}

// Instance singleton
export const autoGeofencing = new AutoGeofencingService()

// Export pour utilisation dans les composants
export default autoGeofencing