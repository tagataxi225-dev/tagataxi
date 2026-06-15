import { APP_CONFIG } from './appConfig';

export const COVERED_CITIES = APP_CONFIG.COVERED_CITIES;
export const DEFAULT_CITY = APP_CONFIG.DEFAULT_CITY;
export const DEFAULT_CURRENCY = APP_CONFIG.DEFAULT_CURRENCY;

export function isCityCovered(city: string): boolean {
  return COVERED_CITIES.some(c => c.toLowerCase() === city.toLowerCase().trim());
}

export function getCityOrDefault(city: string): string {
  return isCityCovered(city) ? city : DEFAULT_CITY;
}
