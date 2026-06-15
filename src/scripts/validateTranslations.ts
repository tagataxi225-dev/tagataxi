#!/usr/bin/env node

// ========== SCRIPT DE VALIDATION DES TRADUCTIONS ==========
// Usage: npm run validate-translations

import { validateTranslations, generateValidationReport } from '../utils/translationValidator';

const main = async () => {
  console.log('🔍 VALIDATION DES TRADUCTIONS KWENDA\n');
  console.log('Scanning for missing translation keys...\n');
  
  try {
    const result = await validateTranslations();
    const report = generateValidationReport(result);
    
    console.log(report);
    
    if (!result.isValid) {
      console.log('\n🛠️  ACTIONS RECOMMANDÉES:');
      console.log('1. Ajouter les clés manquantes dans src/contexts/LanguageContext.tsx');
      console.log('2. Vérifier que toutes les langues (fr, en, kg, lua, sw) sont complètes');
      console.log('3. Relancer la validation avec: npm run validate-translations\n');
      
      process.exit(1); // Échec pour CI/CD
    } else {
      console.log('\n🎉 Toutes les traductions sont valides!');
      process.exit(0); // Succès
    }
  } catch (error) {
    console.error('❌ Erreur lors de la validation:', error);
    process.exit(1);
  }
};

main();