/**
 * Cache des quartiers populaires pour fonctionnement offline
 * Coordonnées et tarifs des zones principales par ville
 */

export interface QuartierData {
  lat: number;
  lng: number;
  name: string;
  tarifs: {
    moto_taxi?: { base: number; perKm: number };
    taxi_bus?: { base: number; perKm: number };
    vtc_prive?: { base: number; perKm: number };
    taxi_prive?: { base: number; perKm: number };
  };
}

export interface CityQuartiers {
  [quartier: string]: QuartierData;
}

export const offlineQuartiers: Record<string, CityQuartiers> = {
  kinshasa: {
    gombe: {
      lat: -4.3025,
      lng: 15.3074,
      name: 'Gombe',
      tarifs: {
        moto_taxi: { base: 1500, perKm: 500 },
        taxi_bus: { base: 300, perKm: 100 },
        vtc_prive: { base: 3000, perKm: 800 }
      }
    },
    lemba: {
      lat: -4.3849,
      lng: 15.3012,
      name: 'Lemba',
      tarifs: {
        moto_taxi: { base: 1500, perKm: 500 },
        taxi_bus: { base: 300, perKm: 100 },
        vtc_prive: { base: 3000, perKm: 800 }
      }
    },
    ngaliema: {
      lat: -4.3753,
      lng: 15.2642,
      name: 'Ngaliema',
      tarifs: {
        moto_taxi: { base: 1500, perKm: 500 },
        taxi_bus: { base: 300, perKm: 100 },
        vtc_prive: { base: 3000, perKm: 800 }
      }
    },
    bandalungwa: {
      lat: -4.3372,
      lng: 15.2906,
      name: 'Bandalungwa',
      tarifs: {
        moto_taxi: { base: 1500, perKm: 500 },
        taxi_bus: { base: 300, perKm: 100 },
        vtc_prive: { base: 3000, perKm: 800 }
      }
    },
    kalamu: {
      lat: -4.3396,
      lng: 15.3177,
      name: 'Kalamu',
      tarifs: {
        moto_taxi: { base: 1500, perKm: 500 },
        taxi_bus: { base: 300, perKm: 100 },
        vtc_prive: { base: 3000, perKm: 800 }
      }
    },
    kasa_vubu: {
      lat: -4.3528,
      lng: 15.2969,
      name: 'Kasa-Vubu',
      tarifs: {
        moto_taxi: { base: 1500, perKm: 500 },
        taxi_bus: { base: 300, perKm: 100 },
        vtc_prive: { base: 3000, perKm: 800 }
      }
    },
    matete: {
      lat: -4.3813,
      lng: 15.2727,
      name: 'Matete',
      tarifs: {
        moto_taxi: { base: 1500, perKm: 500 },
        taxi_bus: { base: 300, perKm: 100 },
        vtc_prive: { base: 3000, perKm: 800 }
      }
    },
    ngiri_ngiri: {
      lat: -4.3244,
      lng: 15.2792,
      name: 'Ngiri-Ngiri',
      tarifs: {
        moto_taxi: { base: 1500, perKm: 500 },
        taxi_bus: { base: 300, perKm: 100 },
        vtc_prive: { base: 3000, perKm: 800 }
      }
    },
    kintambo: {
      lat: -4.3136,
      lng: 15.2897,
      name: 'Kintambo',
      tarifs: {
        moto_taxi: { base: 1500, perKm: 500 },
        taxi_bus: { base: 300, perKm: 100 },
        vtc_prive: { base: 3000, perKm: 800 }
      }
    },
    lingwala: {
      lat: -4.3167,
      lng: 15.3042,
      name: 'Lingwala',
      tarifs: {
        moto_taxi: { base: 1500, perKm: 500 },
        taxi_bus: { base: 300, perKm: 100 },
        vtc_prive: { base: 3000, perKm: 800 }
      }
    },
    masina: {
      lat: -4.3855,
      lng: 15.3919,
      name: 'Masina',
      tarifs: {
        moto_taxi: { base: 1500, perKm: 500 },
        taxi_bus: { base: 300, perKm: 100 },
        vtc_prive: { base: 3000, perKm: 800 }
      }
    },
    ndjili: {
      lat: -4.3915,
      lng: 15.4225,
      name: 'Ndjili',
      tarifs: {
        moto_taxi: { base: 1500, perKm: 500 },
        taxi_bus: { base: 300, perKm: 100 },
        vtc_prive: { base: 3000, perKm: 800 }
      }
    }
  },
  lubumbashi: {
    centre_ville: {
      lat: -11.6647,
      lng: 27.4794,
      name: 'Centre-Ville',
      tarifs: {
        taxi_prive: { base: 3600, perKm: 960 }
      }
    },
    katuba: {
      lat: -11.6453,
      lng: 27.4672,
      name: 'Katuba',
      tarifs: {
        taxi_prive: { base: 3600, perKm: 960 }
      }
    },
    kampemba: {
      lat: -11.6844,
      lng: 27.4636,
      name: 'Kampemba',
      tarifs: {
        taxi_prive: { base: 3600, perKm: 960 }
      }
    },
    kamalondo: {
      lat: -11.6542,
      lng: 27.4897,
      name: 'Kamalondo',
      tarifs: {
        taxi_prive: { base: 3600, perKm: 960 }
      }
    },
    kenya: {
      lat: -11.6789,
      lng: 27.5012,
      name: 'Kenya',
      tarifs: {
        taxi_prive: { base: 3600, perKm: 960 }
      }
    }
  },
  kolwezi: {
    centre_ville: {
      lat: -10.7147,
      lng: 25.4723,
      name: 'Centre-Ville',
      tarifs: {
        taxi_prive: { base: 3300, perKm: 880 }
      }
    },
    manika: {
      lat: -10.7234,
      lng: 25.4589,
      name: 'Manika',
      tarifs: {
        taxi_prive: { base: 3300, perKm: 880 }
      }
    },
    dilala: {
      lat: -10.7065,
      lng: 25.4821,
      name: 'Dilala',
      tarifs: {
        taxi_prive: { base: 3300, perKm: 880 }
      }
    }
  },
};

export const getCityQuartiers = (city: string): CityQuartiers | null => {
  return offlineQuartiers[city.toLowerCase()] || null;
};

export const findNearestQuartier = (lat: number, lng: number, city: string): QuartierData | null => {
  const quartiers = getCityQuartiers(city);
  if (!quartiers) return null;

  let nearest: QuartierData | null = null;
  let minDistance = Infinity;

  Object.values(quartiers).forEach(quartier => {
    const distance = Math.sqrt(
      Math.pow(quartier.lat - lat, 2) + Math.pow(quartier.lng - lng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = quartier;
    }
  });

  return nearest;
};
