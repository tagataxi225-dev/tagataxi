#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const appType = process.env.VITE_APP_TYPE || 'client';

console.log(`📄 Génération du manifest pour l'app ${appType}...`);

const appConfigs = {
  client: {
    name: 'Kwenda Client',
    short_name: 'Client',
    description: 'Application VTC multimodale pour l\'Afrique francophone - Transport, Livraison, Marketplace',
    start_url: '/client',
    theme_color: '#DC2626',
    background_color: '#0B1220',
    shortcuts: [
      {
        name: 'Réserver un taxi',
        short_name: 'Taxi',
        description: 'Réservation rapide de taxi',
        url: '/client?service=transport',
        icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'Livraison',
        short_name: 'Livraison',
        description: 'Commander une livraison',
        url: '/client?service=delivery',
        icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'Marketplace',
        short_name: 'Shop',
        description: 'Acheter des produits',
        url: '/client?service=marketplace',
        icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }]
      }
    ]
  },
  driver: {
    name: 'Kwenda Driver',
    short_name: 'Driver',
    description: 'Application professionnelle pour chauffeurs et livreurs VTC',
    start_url: '/chauffeur',
    theme_color: '#F59E0B',
    background_color: '#0B1220',
    shortcuts: [
      {
        name: 'Mes courses',
        short_name: 'Courses',
        description: 'Voir mes courses actives',
        url: '/chauffeur?tab=courses',
        icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'Mes gains',
        short_name: 'Gains',
        description: 'Consulter mes revenus',
        url: '/chauffeur?tab=wallet',
        icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }]
      }
    ]
  },
  partner: {
    name: 'Kwenda Partner',
    short_name: 'Partner',
    description: 'Application de gestion de flotte et partenaires VTC',
    start_url: '/partenaire',
    theme_color: '#10B981',
    background_color: '#0B1220',
    shortcuts: [
      {
        name: 'Ma flotte',
        short_name: 'Flotte',
        description: 'Gérer ma flotte de véhicules',
        url: '/partenaire?tab=fleet',
        icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'Statistiques',
        short_name: 'Stats',
        description: 'Voir les statistiques',
        url: '/partenaire?tab=stats',
        icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }]
      }
    ]
  }
};

const config = appConfigs[appType];

const manifest = {
  name: config.name,
  short_name: config.short_name,
  description: config.description,
  start_url: config.start_url,
  display: 'standalone',
  background_color: config.background_color,
  theme_color: config.theme_color,
  orientation: 'portrait',
  categories: ['travel', 'business'],
  lang: 'fr',
  dir: 'ltr',
  icons: [
    {
      src: '/android-chrome-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable any'
    },
    {
      src: '/android-chrome-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable any'
    },
    {
      src: '/app-icon-1024.png',
      sizes: '1024x1024',
      type: 'image/png',
      purpose: 'maskable any'
    }
  ],
  screenshots: [
    {
      src: '/splash-screen.png',
      sizes: '1920x1080',
      type: 'image/png',
      form_factor: 'wide',
      label: `Écran d'accueil ${config.name}`
    }
  ],
  shortcuts: config.shortcuts
};

const manifestPath = path.join(__dirname, '../public/manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`✅ Manifest généré avec succès pour ${config.name}`);
