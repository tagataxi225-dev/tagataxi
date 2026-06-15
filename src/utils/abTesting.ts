/**
 * Utilitaires pour l'A/B Testing
 * Hash stable et assignation de variants
 */

/**
 * Hash cyrb53 pour assignation stable des variants
 * Source: https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
 */
export const cyrb53 = (str: string, seed: number = 0): number => {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

/**
 * Assigne un variant à un utilisateur de manière stable
 * Le même userId + experimentId donnera toujours le même variant
 */
export const assignVariant = (
  userId: string,
  experimentId: string,
  weights: { control: number; variant: number } = { control: 50, variant: 50 }
): 'control' | 'variant' => {
  const hash = cyrb53(`${userId}-${experimentId}`);
  const percentage = hash % 100;
  
  const controlThreshold = weights.control;
  return percentage < controlThreshold ? 'control' : 'variant';
};

/**
 * Génère un ID de session unique
 */
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calcule le lift entre deux taux de conversion
 */
export const calculateLift = (controlRate: number, variantRate: number): number => {
  if (controlRate === 0) return 0;
  return ((variantRate - controlRate) / controlRate) * 100;
};

/**
 * Détermine si un résultat est statistiquement significatif
 */
export const isStatisticallySignificant = (confidenceLevel: number): boolean => {
  return confidenceLevel >= 95;
};

/**
 * Formate un pourcentage pour affichage
 */
export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(2)}%`;
};

/**
 * Calcul du Chi-square test simple (approximation)
 */
export const calculateChiSquare = (
  controlConversions: number,
  controlViews: number,
  variantConversions: number,
  variantViews: number
): number => {
  if (controlViews === 0 || variantViews === 0) return 0;
  
  const controlRate = controlConversions / controlViews;
  const variantRate = variantConversions / variantViews;
  
  const pooledRate = (controlConversions + variantConversions) / (controlViews + variantViews);
  
  const expectedControlConversions = controlViews * pooledRate;
  const expectedVariantConversions = variantViews * pooledRate;
  
  const chiSquare = 
    Math.pow(controlConversions - expectedControlConversions, 2) / expectedControlConversions +
    Math.pow(variantConversions - expectedVariantConversions, 2) / expectedVariantConversions;
  
  return chiSquare;
};

/**
 * Convertit un Chi-square en niveau de confiance
 */
export const chiSquareToConfidence = (chiSquare: number): number => {
  if (chiSquare > 10.828) return 99.9;
  if (chiSquare > 6.635) return 99;
  if (chiSquare > 3.841) return 95;
  if (chiSquare > 2.706) return 90;
  if (chiSquare > 1.642) return 80;
  return 0;
};
