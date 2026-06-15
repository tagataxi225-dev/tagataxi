/**
 * 🏆 DRIVER RANKING SERVICE - Phase 3
 * Système de notation prédictive des chauffeurs
 * Utilise ML simple pour prédire le meilleur chauffeur
 */

interface DriverCandidate {
  driver_id: string;
  distance_km: number;
  rating_average?: number;
  total_rides?: number;
  acceptance_rate?: number;
  avg_pickup_time?: number;
  last_active?: string;
}

interface RankedDriver extends DriverCandidate {
  predictedScore: number;
  estimatedArrival: number; // en minutes
  rank: number;
}

interface RankingContext {
  pickup: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  priority: 'low' | 'normal' | 'high';
  timeOfDay: number; // 0-23
}

export class DriverRankingService {
  /**
   * Calcule le score prédictif d'un chauffeur
   */
  private calculatePredictiveScore(
    driver: DriverCandidate,
    context: RankingContext
  ): number {
    let score = 100; // Score de base

    // 1. DISTANCE (poids: 40%) - Plus proche = meilleur
    const distanceScore = Math.max(0, 100 - (driver.distance_km * 10));
    score += distanceScore * 0.4;

    // 2. RATING (poids: 25%) - Meilleure note = meilleur
    const rating = driver.rating_average || 3.5;
    const ratingScore = (rating / 5) * 100;
    score += ratingScore * 0.25;

    // 3. EXPÉRIENCE (poids: 15%) - Plus de courses = meilleur
    const totalRides = driver.total_rides || 0;
    const experienceScore = Math.min(100, (totalRides / 100) * 100);
    score += experienceScore * 0.15;

    // 4. TAUX D'ACCEPTATION (poids: 10%)
    const acceptanceRate = driver.acceptance_rate || 0.7;
    const acceptanceScore = acceptanceRate * 100;
    score += acceptanceScore * 0.1;

    // 5. TEMPS DE PRISE EN CHARGE MOYEN (poids: 10%)
    const avgPickupTime = driver.avg_pickup_time || 10;
    const pickupTimeScore = Math.max(0, 100 - (avgPickupTime * 5));
    score += pickupTimeScore * 0.1;

    // BONUS: Si priorité haute, favoriser les meilleurs
    if (context.priority === 'high' && rating >= 4.5) {
      score += 20;
    }

    // BONUS: Si heure de pointe, favoriser les plus proches
    const rushHours = [7, 8, 9, 17, 18, 19];
    if (rushHours.includes(context.timeOfDay) && driver.distance_km < 2) {
      score += 15;
    }

    return Math.round(score);
  }

  /**
   * Calcule l'ETA d'arrivée du chauffeur
   */
  private calculateETA(distanceKm: number, avgSpeed: number = 30): number {
    // Vitesse moyenne en ville: 30 km/h
    const timeInMinutes = (distanceKm / avgSpeed) * 60;
    
    // Ajouter temps de réaction moyen (1-2 min)
    const reactionTime = 1.5;
    
    return Math.ceil(timeInMinutes + reactionTime);
  }

  /**
   * Classe les chauffeurs par score prédictif
   */
  rankDrivers(
    drivers: DriverCandidate[],
    context: RankingContext
  ): RankedDriver[] {
    console.log(`🏆 [DriverRanking] Ranking ${drivers.length} drivers`);

    const rankedDrivers = drivers.map(driver => ({
      ...driver,
      predictedScore: this.calculatePredictiveScore(driver, context),
      estimatedArrival: this.calculateETA(driver.distance_km),
      rank: 0 // Sera défini après tri
    }));

    // Trier par score décroissant
    rankedDrivers.sort((a, b) => b.predictedScore - a.predictedScore);

    // Assigner les rangs
    rankedDrivers.forEach((driver, index) => {
      driver.rank = index + 1;
    });

    console.log('🏆 [DriverRanking] Top 3 drivers:');
    rankedDrivers.slice(0, 3).forEach(driver => {
      console.log(`  #${driver.rank} - Score: ${driver.predictedScore}, Distance: ${driver.distance_km}km, ETA: ${driver.estimatedArrival}min`);
    });

    return rankedDrivers;
  }

  /**
   * Sélectionne le meilleur chauffeur
   */
  selectBestDriver(
    drivers: DriverCandidate[],
    context: RankingContext
  ): RankedDriver | null {
    const ranked = this.rankDrivers(drivers, context);
    
    if (ranked.length === 0) {
      return null;
    }

    const best = ranked[0];
    console.log(`✅ [DriverRanking] Best driver selected: ${best.driver_id} (score: ${best.predictedScore})`);
    
    return best;
  }

  /**
   * Filtre les chauffeurs par critères minimum
   */
  filterQualifiedDrivers(
    drivers: DriverCandidate[],
    criteria: {
      minRating?: number;
      maxDistance?: number;
      minAcceptanceRate?: number;
    } = {}
  ): DriverCandidate[] {
    const {
      minRating = 3.0,
      maxDistance = 10,
      minAcceptanceRate = 0.5
    } = criteria;

    return drivers.filter(driver => {
      const rating = driver.rating_average || 0;
      const acceptanceRate = driver.acceptance_rate || 0;

      return (
        rating >= minRating &&
        driver.distance_km <= maxDistance &&
        acceptanceRate >= minAcceptanceRate
      );
    });
  }
}

// Instance singleton
export const driverRankingService = new DriverRankingService();
