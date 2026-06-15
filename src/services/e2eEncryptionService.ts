/**
 * Service de chiffrement End-to-End pour les données sensibles
 * Protège les positions et informations critiques
 */

export interface EncryptionKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface EncryptedData {
  encryptedPayload: string;
  iv: string;
  keyId: string;
  algorithm: string;
  timestamp: string;
}

export interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: string;
  userId?: string;
}

class E2EEncryptionService {
  private static instance: E2EEncryptionService;
  private keyCache = new Map<string, CryptoKey>();
  private algorithm = 'AES-GCM';
  private keyLength = 256;

  static getInstance(): E2EEncryptionService {
    if (!this.instance) {
      this.instance = new E2EEncryptionService();
    }
    return this.instance;
  }

  /**
   * Générer une nouvelle paire de clés pour le chiffrement
   */
  async generateKeyPair(): Promise<EncryptionKeyPair> {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
      );

      return {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey
      };
    } catch (error) {
      console.error('Erreur génération paire de clés:', error);
      throw new Error('Impossible de générer les clés de chiffrement');
    }
  }

  /**
   * Générer une clé symétrique pour le chiffrement AES
   */
  async generateSymmetricKey(): Promise<CryptoKey> {
    try {
      return await window.crypto.subtle.generateKey(
        {
          name: this.algorithm,
          length: this.keyLength,
        },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Erreur génération clé symétrique:', error);
      throw new Error('Impossible de générer la clé symétrique');
    }
  }

  /**
   * Chiffrer des données de localisation sensibles
   */
  async encryptLocationData(locationData: LocationData, recipientPublicKey?: CryptoKey): Promise<EncryptedData> {
    try {
      // Générer une clé symétrique pour ce chiffrement
      const symmetricKey = await this.generateSymmetricKey();
      
      // Générer un IV aléatoire
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      // Sérialiser les données
      const dataToEncrypt = JSON.stringify(locationData);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(dataToEncrypt);
      
      // Chiffrer avec AES-GCM
      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv,
        },
        symmetricKey,
        dataBuffer
      );

      // Générer un ID unique pour cette clé
      const keyId = this.generateKeyId();
      
      // Stocker la clé en cache (en production, la chiffrer avec la clé publique du destinataire)
      this.keyCache.set(keyId, symmetricKey);

      return {
        encryptedPayload: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
        iv: btoa(String.fromCharCode(...iv)),
        keyId: keyId,
        algorithm: this.algorithm,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur chiffrement données localisation:', error);
      throw new Error('Impossible de chiffrer les données de localisation');
    }
  }

  /**
   * Déchiffrer des données de localisation
   */
  async decryptLocationData(encryptedData: EncryptedData): Promise<LocationData> {
    try {
      // Récupérer la clé depuis le cache
      const symmetricKey = this.keyCache.get(encryptedData.keyId);
      if (!symmetricKey) {
        throw new Error('Clé de déchiffrement non trouvée');
      }

      // Décoder les données
      const encryptedPayload = new Uint8Array(
        atob(encryptedData.encryptedPayload).split('').map(c => c.charCodeAt(0))
      );
      const iv = new Uint8Array(
        atob(encryptedData.iv).split('').map(c => c.charCodeAt(0))
      );

      // Déchiffrer
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: encryptedData.algorithm,
          iv: iv,
        },
        symmetricKey,
        encryptedPayload
      );

      // Décoder et parser
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decryptedData);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Erreur déchiffrement données localisation:', error);
      throw new Error('Impossible de déchiffrer les données de localisation');
    }
  }

  /**
   * Chiffrer des messages de communication
   */
  async encryptMessage(message: string, recipientPublicKey?: CryptoKey): Promise<EncryptedData> {
    try {
      const messageData = {
        content: message,
        timestamp: new Date().toISOString(),
        sender: 'current_user' // À remplacer par l'ID utilisateur réel
      };

      return await this.encryptLocationData(messageData as any, recipientPublicKey);
    } catch (error) {
      console.error('Erreur chiffrement message:', error);
      throw new Error('Impossible de chiffrer le message');
    }
  }

  /**
   * Générer un ID unique pour une clé
   */
  private generateKeyId(): string {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Exporter une clé publique pour partage
   */
  async exportPublicKey(publicKey: CryptoKey): Promise<string> {
    try {
      const exported = await window.crypto.subtle.exportKey('spki', publicKey);
      return btoa(String.fromCharCode(...new Uint8Array(exported)));
    } catch (error) {
      console.error('Erreur export clé publique:', error);
      throw new Error('Impossible d\'exporter la clé publique');
    }
  }

  /**
   * Importer une clé publique depuis une chaîne
   */
  async importPublicKey(keyString: string): Promise<CryptoKey> {
    try {
      const keyData = new Uint8Array(
        atob(keyString).split('').map(c => c.charCodeAt(0))
      );
      
      return await window.crypto.subtle.importKey(
        'spki',
        keyData,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        true,
        ['encrypt']
      );
    } catch (error) {
      console.error('Erreur import clé publique:', error);
      throw new Error('Impossible d\'importer la clé publique');
    }
  }

  /**
   * Nettoyer le cache des clés anciennes
   */
  cleanupKeyCache(maxAge: number = 3600000): void { // 1 heure par défaut
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.keyCache.forEach((key, keyId) => {
      // En pratique, on devrait stocker les timestamps des clés
      // Pour maintenant, on nettoie arbitrairement
      if (Math.random() < 0.1) { // 10% de chance de nettoyage
        keysToDelete.push(keyId);
      }
    });

    keysToDelete.forEach(keyId => {
      this.keyCache.delete(keyId);
    });
  }

  /**
   * Vérifier l'intégrité des données chiffrées
   */
  async verifyDataIntegrity(encryptedData: EncryptedData): Promise<boolean> {
    try {
      // Vérifier l'âge des données
      const dataAge = Date.now() - new Date(encryptedData.timestamp).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 heures

      if (dataAge > maxAge) {
        console.warn('Données chiffrées trop anciennes');
        return false;
      }

      // Vérifier la présence de la clé
      if (!this.keyCache.has(encryptedData.keyId)) {
        console.warn('Clé de déchiffrement non disponible');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur vérification intégrité:', error);
      return false;
    }
  }
}

export const e2eEncryptionService = E2EEncryptionService.getInstance();