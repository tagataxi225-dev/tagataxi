/**
 * Lieux fixes populaires d'Abidjan utilisés par la section "Lieux populaires"
 * de l'accueil client (HomePopularPlaces).
 *
 * Source unique et isolée : NE PAS importer depuis le flux taxi
 * (DestinationSearchDialog garde sa propre liste) afin d'éviter tout couplage.
 */
export interface FixedPlace {
  name: string;
  lat: number;
  lng: number;
}

export const ABIDJAN_FIXED_PLACES: FixedPlace[] = [
  { name: 'Aéroport FHB', lat: 5.2539, lng: -3.9263 },
  { name: 'Plateau', lat: 5.3200, lng: -4.0100 },
  { name: 'Cocody', lat: 5.3599, lng: -3.9810 },
  { name: 'Marcory', lat: 5.2845, lng: -3.9870 },
  { name: 'Treichville', lat: 5.2900, lng: -4.0050 },
];
