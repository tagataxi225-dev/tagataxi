import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  FileText, 
  Code, 
  Smartphone, 
  Globe, 
  Truck, 
  Store, 
  CreditCard, 
  Shield, 
  Zap,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Download,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentationSection {
  id: string;
  title: string;
  icon: any;
  content: string;
  codeExamples?: Array<{
    title: string;
    language: string;
    code: string;
  }>;
  subsections?: Array<{
    title: string;
    content: string;
  }>;
}

const ProjectDocumentation: React.FC = () => {
  const { toast } = useToast();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['overview']));
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    const newOpen = new Set(openSections);
    if (newOpen.has(sectionId)) {
      newOpen.delete(sectionId);
    } else {
      newOpen.add(sectionId);
    }
    setOpenSections(newOpen);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
      toast({
        title: "Code copié",
        description: "Le code a été copié dans le presse-papiers",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le code",
        variant: "destructive",
      });
    }
  };

  const documentationSections: DocumentationSection[] = [
    {
      id: 'overview',
      title: 'Vue d\'ensemble du projet',
      icon: FileText,
      content: `
# TAGA Taxi - Application VTC Congo RDC

## Vision
TAGA Taxi est une application de transport multimodale conçue spécifiquement pour Kinshasa, République Démocratique du Congo. Elle combine transport VTC, livraison de colis et marketplace dans une seule plateforme adaptée aux réalités locales.

## Objectifs
- Faciliter les déplacements à Kinshasa avec des véhicules adaptés
- Optimiser l'expérience pour les connexions 2G/3G
- Supporter les langues locales (Français, Lingala, Kikongo, Tshiluba, Swahili)
- Intégrer les systèmes de paiement mobile congolais
- Fournir une interface simplifiée pour tous niveaux d'utilisateurs

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Mobile**: PWA optimisée pour iOS/Android
- **Paiements**: Mobile Money (Airtel, M-Pesa, Orange)
- **Maps**: OpenStreetMap avec données locales Kinshasa
      `,
      subsections: [
        {
          title: 'Fonctionnalités principales',
          content: `
• **Transport VTC**: Moto-taxi (Wewa), Taxi-bus (Fula-fula), Transco Bus
• **Livraison**: Colis de toutes tailles avec suivi temps réel
• **Marketplace**: Vente en ligne avec vendeurs locaux
• **Multilingue**: 5 langues supportées
• **Paiement mobile**: Airtel Money, M-Pesa, Orange Money
• **Mode offline**: Fonctionnalités essentielles hors ligne
          `
        },
        {
          title: 'Adaptations Congo RDC',
          content: `
• **Types de véhicules**: Adaptés au transport local kinois
• **Quartiers**: Base de données complète des communes de Kinshasa
• **Monnaie**: Prix en Francs Congolais (CDF) et USD
• **Connectivité**: Optimisé pour 2G/3G/Edge
• **Culture**: Interface adaptée aux habitudes locales
          `
        }
      ]
    },
    {
      id: 'architecture',
      title: 'Architecture technique',
      icon: Code,
      content: `
## Structure du projet

Le projet suit une architecture modulaire avec séparation claire des responsabilités :

### Frontend (React/TypeScript)
- **Pages**: Index, Client, Driver, Partner, Admin
- **Components**: Composants réutilisables organisés par domaine
- **Contexts**: Gestion d'état globale (Langue, Thème)
- **Hooks**: Logique métier réutilisable
- **Utils**: Fonctions utilitaires

### Backend (Supabase)
- **Database**: PostgreSQL avec RLS (Row Level Security)
- **Auth**: Authentification utilisateurs
- **Storage**: Fichiers et images
- **Edge Functions**: Logique métier côté serveur
      `,
      codeExamples: [
        {
          title: 'Structure des dossiers',
          language: 'text',
          code: `
src/
├── components/
│   ├── transport/          # Composants transport
│   ├── delivery/           # Composants livraison
│   ├── marketplace/        # Composants marketplace
│   ├── advanced/           # Fonctionnalités avancées
│   ├── optimization/       # Optimisations performance
│   ├── testing/            # Suite de tests
│   └── ui/                 # Composants UI de base
├── contexts/               # Contextes React
├── hooks/                  # Hooks personnalisés
├── pages/                  # Pages principales
├── lib/                    # Utilitaires
└── assets/                 # Images et ressources
          `
        },
        {
          title: 'Configuration Tailwind Congo',
          language: 'typescript',
          code: `
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Couleurs inspirées du Congo
        'congo-green': 'hsl(120, 100%, 25%)',
        'congo-yellow': 'hsl(60, 100%, 50%)',
        'congo-red': 'hsl(0, 100%, 50%)',
        'congo-blue': 'hsl(210, 100%, 35%)',
        
        // Système sémantique
        primary: 'hsl(var(--primary))',
        secondary: 'hsl(var(--secondary))',
        accent: 'hsl(var(--accent))',
      },
      fontFamily: {
        kinshasa: ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  }
}
          `
        }
      ]
    },
    {
      id: 'transport',
      title: 'Module Transport',
      icon: Smartphone,
      content: `
## Service de Transport VTC

Le module transport gère les réservations de véhicules adaptés au contexte kinois.

### Types de véhicules supportés
1. **Moto-taxi (Wewa)**: Transport rapide individuel
2. **Taxi-bus (Fula-fula)**: Transport collectif
3. **Transco Bus**: Transport public
4. **Taxi classique**: Voiture individuelle
5. **VIP**: Véhicules de luxe

### Fonctionnalités
- Géolocalisation avec cartographie Kinshasa
- Calcul d'itinéraires optimisés
- Estimation de prix en CDF
- Suivi temps réel du véhicule
- Évaluation chauffeur/passager
      `,
      codeExamples: [
        {
          title: 'Types de véhicules Congo',
          language: 'typescript',
          code: `
// Définition des véhicules congolais
export const congoVehicles = [
  {
    id: 'moto-taxi',
    name: 'Moto-taxi (Wewa)',
    description: 'Transport rapide en moto',
    basePrice: 2000, // CDF
    multiplier: 1.0,
    capacity: 1,
    estimatedTime: 15,
    icon: Bike,
    features: ['Rapide', 'Économique', 'Circulation facile'],
    available: true
  },
  {
    id: 'taxi-bus',
    name: 'Taxi-bus (Fula-fula)',
    description: 'Transport collectif',
    basePrice: 800, // CDF
    multiplier: 0.5,
    capacity: 15,
    estimatedTime: 30,
    icon: Truck,
    features: ['Très économique', 'Transport collectif'],
    available: true
  }
  // ...
];
          `
        },
        {
          title: 'Calcul de prix Congo',
          language: 'typescript',
          code: `
// Calcul adapté au marché congolais
export const calculateCongoPrice = (
  distance: number, 
  vehicleType: string,
  timeOfDay: 'peak' | 'normal' | 'night'
) => {
  const baseRates = {
    'moto-taxi': 2000,
    'taxi-bus': 800,
    'transco-bus': 500,
    'taxi-standard': 3000,
    'vip': 8000
  };
  
  const timeMultipliers = {
    peak: 1.5,     // Heures de pointe
    normal: 1.0,   // Heures normales
    night: 1.3     // Nuit (après 22h)
  };
  
  const basePrice = baseRates[vehicleType];
  const distancePrice = distance * 500; // 500 CDF/km
  const timeMultiplier = timeMultipliers[timeOfDay];
  
  return Math.round((basePrice + distancePrice) * timeMultiplier);
};
          `
        }
      ]
    },
    {
      id: 'delivery',
      title: 'Module Livraison',
      icon: Truck,
      content: `
## Service de Livraison

Système de livraison adapté aux besoins locaux kinois.

### Types de colis
- **Petit colis**: 0-5kg (documents, téléphones)
- **Moyen colis**: 5-15kg (vêtements, électronique)
- **Grand colis**: 15kg+ (électroménager)
- **Express**: Livraison urgente
- **Fragile**: Manipulation spéciale

### Zones de livraison
Couverture complète des 24 communes de Kinshasa avec tarification adaptée.
      `,
      codeExamples: [
        {
          title: 'Types de colis Congo',
          language: 'typescript',
          code: `
export const packageTypes = [
  {
    id: 'petit-colis',
    name: 'Petit colis',
    description: 'Documents, téléphones, bijoux',
    maxWeight: '5kg',
    basePrice: 3000, // CDF
    examples: ['Téléphone', 'Documents', 'Bijoux', 'Médicaments']
  },
  {
    id: 'moyen-colis', 
    name: 'Moyen colis',
    description: 'Vêtements, chaussures, électronique',
    maxWeight: '15kg',
    basePrice: 5000, // CDF
    examples: ['Vêtements', 'Chaussures', 'Tablette', 'Livres']
  },
  {
    id: 'grand-colis',
    name: 'Grand colis',
    description: 'Électroménager, meubles',
    maxWeight: '50kg+',
    basePrice: 12000, // CDF
    examples: ['Télévision', 'Micro-onde', 'Ventilateur']
  }
];
          `
        }
      ]
    },
    {
      id: 'marketplace',
      title: 'Module Marketplace',
      icon: Store,
      content: `
## Marketplace E-commerce

Plateforme de vente en ligne adaptée au marché congolais.

### Catégories principales
- **Électronique**: Téléphones, ordinateurs, accessoires
- **Mode**: Vêtements, chaussures, accessoires
- **Maison**: Électroménager, décoration, meubles
- **Alimentation**: Produits frais, épicerie
- **Beauté**: Cosmétiques, soins personnels
- **Automobile**: Pièces détachées, accessoires

### Fonctionnalités
- Recherche avancée avec filtres
- Panier d'achat intelligent
- Système d'évaluation vendeurs
- Chat avec vendeurs
- Livraison intégrée
      `,
      codeExamples: [
        {
          title: 'Interface produit',
          language: 'typescript',
          code: `
interface Product {
  id: string;
  name: string;
  price: number; // CDF
  originalPrice?: number;
  images: string[];
  rating: number;
  reviews: number;
  seller: string;
  category: string;
  description: string;
  specifications: Record<string, string>;
  inStock: boolean;
  stockCount: number;
  shippingOptions: {
    free: boolean;
    express: boolean;
    estimatedDays: number;
  };
}
          `
        }
      ]
    },
    {
      id: 'payments',
      title: 'Système de Paiement',
      icon: CreditCard,
      content: `
## Paiements Mobile Money

Intégration des systèmes de paiement mobile congolais.

### Opérateurs supportés
- **Airtel Money**: Principal opérateur
- **M-Pesa** (Vodacom): Largement utilisé
- **Orange Money**: En expansion
- **Espèces**: Option disponible

### Devises
- **Franc Congolais (CDF)**: Monnaie principale
- **Dollar US (USD)**: Pour gros achats

### Sécurité
- Chiffrement end-to-end
- Vérification OTP
- Limitation des montants
- Historique détaillé
      `,
      codeExamples: [
        {
          title: 'Interface paiement mobile',
          language: 'typescript',
          code: `
interface MobileMoneyPayment {
  provider: 'airtel' | 'mpesa' | 'orange';
  phoneNumber: string;
  amount: number;
  currency: 'XOF' | 'USD';
  reference: string;
  description: string;
}

const processPayment = async (payment: MobileMoneyPayment) => {
  // 1. Validation du numéro
  if (!validatePhoneNumber(payment.phoneNumber, payment.provider)) {
    throw new Error('Numéro invalide');
  }
  
  // 2. Vérification du solde (si API disponible)
  // 3. Initiation du paiement
  // 4. Attente confirmation OTP
  // 5. Finalisation transaction
};
          `
        }
      ]
    },
    {
      id: 'languages',
      title: 'Support Multilingue',
      icon: Globe,
      content: `
## Internationalisation

Support de 5 langues locales pour une meilleure accessibilité.

### Langues supportées
1. **Français**: Langue officielle
2. **Lingala**: Langue véhiculaire Kinshasa
3. **Kikongo**: Bas-Congo, Kinshasa
4. **Tshiluba**: Kasaï, communautés
5. **Swahili**: Est du Congo, commerçants

### Implémentation
- Context React pour la langue active
- Fichiers de traduction JSON
- Formatage adapté (nombres, devises)
- Interface RTL si nécessaire
      `,
      codeExamples: [
        {
          title: 'Context de langue',
          language: 'typescript',
          code: `
interface LanguageContextType {
  language: 'fr' | 'ln' | 'kg' | 'lu' | 'sw';
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  formatCurrency: (amount: number, currency?: string) => string;
}

// Traductions Lingala exemple
const lingalaTranslations = {
  'welcome': 'Boyei malamu',
  'transport': 'Transport',
  'delivery': 'Livraison',
  'marketplace': 'Marché',
  'book_ride': 'Koma mobembo',
  'price': 'Ntalo'
};
          `
        }
      ]
    },
    {
      id: 'optimization',
      title: 'Optimisations Performance',
      icon: Zap,
      content: `
## Optimisations pour Connexions Lentes

Adaptations spécifiques aux défis de connectivité à Kinshasa.

### Stratégies d'optimisation
1. **Chargement progressif**: Lazy loading des composants
2. **Compression images**: WebP avec fallback
3. **Cache intelligent**: Service Worker avancé
4. **Mode offline**: Fonctionnalités critiques hors ligne
5. **Préchargement**: Ressources essentielles
6. **Minification**: Code et assets optimisés

### Adaptations réseau
- Détection qualité connexion
- Basculement 2G/3G/4G
- Retry automatique
- Indication état réseau
- Économie de données
      `,
      codeExamples: [
        {
          title: 'Détection de connexion',
          language: 'typescript',
          code: `
const useNetworkStatus = () => {
  const [connectionType, setConnectionType] = useState<'2g' | '3g' | '4g' | 'wifi'>('4g');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const connection = (navigator as any).connection;
    
    if (connection) {
      const updateConnection = () => {
        const effectiveType = connection.effectiveType;
        setConnectionType(effectiveType);
      };
      
      connection.addEventListener('change', updateConnection);
      updateConnection();
    }
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return { connectionType, isOnline };
};
          `
        }
      ]
    },
    {
      id: 'security',
      title: 'Sécurité et Vérifications',
      icon: Shield,
      content: `
## Sécurité et Vérification d'Identité

Système de sécurité adapté au contexte congolais.

### Vérifications disponibles
1. **Téléphone**: SMS OTP obligatoire
2. **Documents**: Carte d'identité, permis de conduire
3. **Selfie**: Vérification faciale basique
4. **Références**: Validation par pairs

### Niveaux de sécurité
- **Basique**: Téléphone vérifié
- **Standard**: + Document d'identité
- **Premium**: + Vérification faciale
- **Pro**: Toutes vérifications + références

### Protection des données
- Chiffrement AES-256
- Conformité RGPD
- Stockage local minimal
- Audit trails complets
      `,
      codeExamples: [
        {
          title: 'Vérification téléphone',
          language: 'typescript',
          code: `
const verifyPhoneNumber = async (phoneNumber: string) => {
  // Format Congo: +243 xxx xxx xxx
  const congoPhoneRegex = /^\\+243[0-9]{9}$/;
  
  if (!congoPhoneRegex.test(phoneNumber)) {
    throw new Error('Format numéro congolais requis');
  }
  
  // Génération code OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000);
  
  // Envoi SMS via API locale
  await sendSMS(phoneNumber, \`Votre code TAGA Taxi: \${otpCode}\`);
  
  return { success: true, reference: generateReference() };
};
          `
        }
      ]
    }
  ];

  const generateProjectReport = () => {
    const report = {
      project: 'TAGA Taxi Congo RDC',
      version: '1.0.0',
      generated: new Date().toISOString(),
      features: [
        'Transport VTC adapté Congo',
        'Livraison multimodale',
        'Marketplace local',
        'Paiement Mobile Money',
        'Support 5 langues locales',
        'Optimisation connexions lentes',
        'Mode offline',
        'Sécurité renforcée'
      ],
      technologies: [
        'React 18',
        'TypeScript',
        'Tailwind CSS',
        'Supabase',
        'PWA',
        'Service Workers'
      ],
      coverage: {
        components: 89,
        pages: 5,
        languages: 5,
        paymentMethods: 3,
        vehicleTypes: 5
      }
    };
    
    return JSON.stringify(report, null, 2);
  };

  const downloadDocumentation = () => {
    const allContent = documentationSections.map(section => 
      `# ${section.title}\n\n${section.content}\n\n`
    ).join('');
    
    const blob = new Blob([allContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kwenda-taxi-documentation.md';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Documentation téléchargée",
      description: "Fichier Markdown généré avec succès",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Documentation Projet TAGA Taxi
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Documentation complète de l'application VTC pour Kinshasa
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={downloadDocumentation}
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const report = generateProjectReport();
                  copyToClipboard(report, 'project-report');
                }}
              >
                {copiedCode === 'project-report' ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                Rapport
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">10</div>
              <div className="text-sm text-muted-foreground">Phases complétées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">89</div>
              <div className="text-sm text-muted-foreground">Composants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">5</div>
              <div className="text-sm text-muted-foreground">Langues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">100%</div>
              <div className="text-sm text-muted-foreground">Congo-ready</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections de documentation */}
      <div className="space-y-4">
        {documentationSections.map(section => {
          const isOpen = openSections.has(section.id);
          const Icon = section.icon;
          
          return (
            <Card key={section.id}>
              <Collapsible open={isOpen} onOpenChange={() => toggleSection(section.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-primary" />
                        {section.title}
                      </CardTitle>
                      {isOpen ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="space-y-6">
                    {/* Contenu principal */}
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto">
                        {section.content}
                      </pre>
                    </div>
                    
                    {/* Sous-sections */}
                    {section.subsections && (
                      <div className="space-y-4">
                        {section.subsections.map((subsection, index) => (
                          <Card key={index} className="bg-muted/30">
                            <CardHeader className="pb-2">
                              <h4 className="font-medium">{subsection.title}</h4>
                            </CardHeader>
                            <CardContent>
                              <pre className="whitespace-pre-wrap text-sm">
                                {subsection.content}
                              </pre>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                    
                    {/* Exemples de code */}
                    {section.codeExamples && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-lg">Exemples de code</h4>
                        {section.codeExamples.map((example, index) => (
                          <Card key={index} className="bg-slate-900 text-slate-100">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Code className="w-4 h-4" />
                                  <span className="font-medium">{example.title}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {example.language}
                                  </Badge>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(example.code, `${section.id}-${index}`)}
                                  className="text-slate-300 hover:text-white"
                                >
                                  {copiedCode === `${section.id}-${index}` ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <pre className="text-sm overflow-auto">
                                <code>{example.code}</code>
                              </pre>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectDocumentation;