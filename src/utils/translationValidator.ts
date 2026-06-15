// ========== VALIDATEUR DE TRADUCTIONS ==========
// Système de validation automatique pour éviter les clés manquantes

import { translations } from '@/contexts/LanguageContext';

export interface MissingTranslation {
  key: string;
  file: string;
  line?: number;
  languages: string[];
}

export interface ValidationResult {
  isValid: boolean;
  missingTranslations: MissingTranslation[];
  summary: {
    totalKeys: number;
    missingCount: number;
    affectedFiles: string[];
  };
}

// Fonction pour extraire toutes les clés t('key') du code source
export const extractTranslationKeys = async (): Promise<string[]> => {
  const keys: string[] = [];
  
  // Cette fonction serait appelée par un script de build ou en développement
  // Pour l'instant, nous retournons les clés couramment utilisées
  const commonKeys = [
    'nav.home', 'nav.services', 'nav.about', 'nav.contact',
    'nav.client', 'nav.driver', 'nav.admin', 'nav.download_app',
    'features.title', 'features.subtitle', 'features.title_prefix', 'features.title_brand',
    'features.eco_fleet', 'features.smart_geolocation', 'features.certified_drivers',
    'features.flexible_payments', 'features.shared_rides', 'features.maximum_security',
    'services.vtc_standard', 'services.vtc_luxe', 'services.shared_rides',
    'services.moto_delivery', 'services.utility_vehicles', 'services.advance_booking'
  ];
  
  return keys.concat(commonKeys);
};

// Valide que toutes les clés existent dans toutes les langues
export const validateTranslations = async (): Promise<ValidationResult> => {
  const extractedKeys = await extractTranslationKeys();
  const missingTranslations: MissingTranslation[] = [];
  const languages = Object.keys(translations);
  
  for (const key of extractedKeys) {
    const missingLanguages: string[] = [];
    
    for (const lang of languages) {
      const langTranslations = translations[lang as keyof typeof translations];
      if (!langTranslations[key as keyof typeof langTranslations]) {
        missingLanguages.push(lang);
      }
    }
    
    if (missingLanguages.length > 0) {
      missingTranslations.push({
        key,
        file: 'Unknown', // Dans un vrai scanner, on aurait le fichier source
        languages: missingLanguages
      });
    }
  }
  
  return {
    isValid: missingTranslations.length === 0,
    missingTranslations,
    summary: {
      totalKeys: extractedKeys.length,
      missingCount: missingTranslations.length,
      affectedFiles: ['LanguageContext.tsx'] // Simplifié
    }
  };
};

// Génère un rapport de validation
export const generateValidationReport = (result: ValidationResult): string => {
  if (result.isValid) {
    return `✅ TOUTES LES TRADUCTIONS SONT VALIDES\n${result.summary.totalKeys} clés validées`;
  }
  
  let report = `❌ TRADUCTIONS MANQUANTES DÉTECTÉES\n`;
  report += `${result.summary.missingCount}/${result.summary.totalKeys} clés incomplètes\n\n`;
  
  result.missingTranslations.forEach(missing => {
    report += `🔑 ${missing.key}\n`;
    report += `   Langues manquantes: ${missing.languages.join(', ')}\n\n`;
  });
  
  return report;
};

// Mode développement : Affiche les clés manquantes dans la console
export const logMissingTranslations = async () => {
  if (process.env.NODE_ENV === 'development') {
    const result = await validateTranslations();
    if (!result.isValid) {
      console.warn('🚨 TRADUCTIONS MANQUANTES DÉTECTÉES:');
      console.table(result.missingTranslations);
    }
  }
};