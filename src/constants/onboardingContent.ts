import { 
  Car, PackageCheck, Wallet,
  Gauge, CreditCard, Shield,
  Layers, TrendingUp, Wallet as WalletIcon,
  Store, ShoppingCart, Lock,
  Monitor, AlertTriangle, ShieldCheck,
  LucideIcon
} from "lucide-react";

export type OnboardingContext = "client" | "chauffeur" | "partenaire" | "marketplace" | "admin";

export interface OnboardingSlideContent {
  icon: LucideIcon;
  title: string;
  tagline: string;
  benefits: string[];
}

export const onboardingContent: Record<OnboardingContext, OnboardingSlideContent[]> = {
  // CLIENT: 3 slides épurés
  client: [
    {
      icon: Car,
      title: "Vos trajets simplifiés",
      tagline: "Moto, Taxi, Bus — en 2 taps",
      benefits: [
        "GPS temps réel",
        "Prix transparents"
      ]
    },
    {
      icon: PackageCheck,
      title: "Livraison & Shopping",
      tagline: "Express, Marketplace, Food",
      benefits: [
        "Tracking live",
        "Paiement sécurisé"
      ]
    },
    {
      icon: Wallet,
      title: "TAGAPay Wallet",
      tagline: "Payez et gagnez à chaque course",
      benefits: [
        "Cashback instantané",
        "Loterie quotidienne"
      ]
    }
  ],
  
  // CHAUFFEUR: 3 slides
  chauffeur: [
    {
      icon: Gauge,
      title: "Dashboard temps réel",
      tagline: "Suivez vos gains instantanément",
      benefits: [
        "Revenus actualisés",
        "Défis & récompenses"
      ]
    },
    {
      icon: CreditCard,
      title: "Abonnements flexibles",
      tagline: "Optimisez vos revenus",
      benefits: [
        "Plans adaptés",
        "Retraits instantanés"
      ]
    },
    {
      icon: Shield,
      title: "Validation sécurisée",
      tagline: "Processus rapide et transparent",
      benefits: [
        "Documents vérifiés",
        "Support dédié"
      ]
    }
  ],
  
  // PARTENAIRE: 3 slides
  partenaire: [
    {
      icon: Layers,
      title: "Gérez votre flotte",
      tagline: "Gestion centralisée multi-véhicules",
      benefits: [
        "Vue d'ensemble",
        "Validation chauffeurs"
      ]
    },
    {
      icon: TrendingUp,
      title: "Analytics avancées",
      tagline: "Visualisez vos KPIs",
      benefits: [
        "Dashboard financier",
        "Rapports exportables"
      ]
    },
    {
      icon: WalletIcon,
      title: "Gestion financière",
      tagline: "Commissions et retraits",
      benefits: [
        "Automatisation",
        "Historique complet"
      ]
    }
  ],
  
  // MARKETPLACE: 3 slides
  marketplace: [
    {
      icon: Store,
      title: "Vendez facilement",
      tagline: "Mettez en ligne en 2 minutes",
      benefits: [
        "Upload simplifié",
        "Chat intégré"
      ]
    },
    {
      icon: ShoppingCart,
      title: "Achetez en confiance",
      tagline: "Produits validés et garantis",
      benefits: [
        "Vendeurs certifiés",
        "Garantie livraison"
      ]
    },
    {
      icon: Lock,
      title: "Paiement sécurisé",
      tagline: "TAGAPay 100% protégé",
      benefits: [
        "Escrow automatique",
        "Mobile Money"
      ]
    }
  ],
  
  // ADMIN: 3 slides
  admin: [
    {
      icon: Monitor,
      title: "Supervision totale",
      tagline: "Opérations multi-villes",
      benefits: [
        "Dashboard global",
        "Zones tarifaires"
      ]
    },
    {
      icon: AlertTriangle,
      title: "Alertes temps réel",
      tagline: "Contrôle permanent",
      benefits: [
        "Détection fraudes",
        "Notifications push"
      ]
    },
    {
      icon: ShieldCheck,
      title: "Sécurité RLS",
      tagline: "Conformité automatisée",
      benefits: [
        "Validation IA",
        "Audit trail"
      ]
    }
  ]
};

export const contextColors: Record<OnboardingContext, string> = {
  client: "hsl(var(--destructive))",
  chauffeur: "hsl(var(--warning))",
  partenaire: "hsl(var(--success))",
  marketplace: "hsl(var(--chart-5))",
  admin: "hsl(var(--muted-foreground))"
};
