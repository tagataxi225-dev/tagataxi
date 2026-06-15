/**
 * 🔐 STOCKAGE SÉCURISÉ CHIFFRÉ
 * 
 * Utilitaire de chiffrement pour localStorage afin de protéger
 * les données sensibles contre l'accès non autorisé
 * 
 * @security Utilise AES-256 pour le chiffrement
 */

import CryptoJS from 'crypto-js';
import { secureLog } from './secureLogger';

/**
 * Génère une clé de chiffrement unique par appareil
 * Utilise une combinaison de données uniques pour créer une clé stable
 */
const generateDeviceKey = (): string => {
  try {
    // Récupérer ou créer un ID unique pour cet appareil
    let deviceId = localStorage.getItem('__device_id');

    if (!deviceId) {
      // Générer un UUID v4 comme ID d'appareil
      deviceId = crypto.randomUUID();
      localStorage.setItem('__device_id', deviceId);
    }

    // Combiner avec un salt statique pour renforcer la sécurité
    const salt = 'kwenda-secure-2025';
    return CryptoJS.SHA256(deviceId + salt).toString();
  } catch {
    return CryptoJS.SHA256('kwenda-fallback-2025').toString();
  }
};

// Clé de chiffrement générée dynamiquement par appareil
const ENCRYPTION_KEY = generateDeviceKey();

/**
 * Interface de stockage sécurisé compatible localStorage
 */
export const secureStorage = {
  /**
   * Stocke une valeur chiffrée dans localStorage
   * @param key - Clé de stockage
   * @param value - Valeur à stocker (sera sérialisée en JSON puis chiffrée)
   */
  setItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      const encrypted = CryptoJS.AES.encrypt(serialized, ENCRYPTION_KEY).toString();
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.warn('❌ Erreur de chiffrement:', error);
      return;
    }
  },

  /**
   * Récupère et déchiffre une valeur depuis localStorage
   * @param key - Clé de stockage
   * @returns Valeur déchiffrée ou null si inexistante/invalide
   */
  getItem(key: string): any | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      // Tenter le déchiffrement
      const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        // Données potentiellement corrompues ou clé incorrecte
        secureLog.warn('⚠️ Impossible de déchiffrer les données pour:', key);
        return null;
      }

      return JSON.parse(decryptedString);
    } catch (error) {
      secureLog.error('❌ Erreur de déchiffrement:', error);
      return null;
    }
  },

  /**
   * Supprime une clé du localStorage
   * @param key - Clé à supprimer
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  /**
   * Vide tout le localStorage sécurisé
   */
  clear(): void {
    localStorage.clear();
  },

  /**
   * Vérifie si une clé existe
   * @param key - Clé à vérifier
   */
  hasItem(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
};

/**
 * Migration des données non chiffrées vers stockage sécurisé
 * @param key - Clé à migrer
 */
export const migrateToSecureStorage = (key: string): void => {
  try {
    const existing = localStorage.getItem(key);
    if (!existing) return;

    // Tenter de parser directement (données non chiffrées)
    try {
      const parsed = JSON.parse(existing);
      // Si parsing réussit, c'est du non-chiffré → rechiffrer
      secureStorage.setItem(key, parsed);
      secureLog.log(`✅ Migré vers stockage sécurisé: ${key}`);
    } catch {
      // Déjà chiffré ou invalide, ne rien faire
    }
  } catch (error) {
    secureLog.error('❌ Erreur de migration:', error);
  }
};

/**
 * Migre TOUTES les données localStorage vers secureStorage
 * À exécuter une fois au démarrage de l'app
 */
export const migrateAllToSecureStorage = (): void => {
  const keysToMigrate = [
    'user_preferences',
    'recent_searches',
    'saved_places',
    'app_settings',
    'theme_preference',
    'language_preference'
  ];

  let migratedCount = 0;
  keysToMigrate.forEach(key => {
    try {
      migrateToSecureStorage(key);
      migratedCount++;
    } catch (error) {
      secureLog.error(`Échec migration ${key}:`, error);
    }
  });

  secureLog.log(`✅ Migration complète: ${migratedCount}/${keysToMigrate.length} clés migrées`);
};
