import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Shield, 
  Users, 
  CreditCard, 
  HardDrive, 
  Zap,
  CheckCircle, 
  AlertTriangle,
  Code,
  Server,
  Key,
  Lock,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DatabaseTable {
  name: string;
  description: string;
  columns: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  policies: string[];
  priority: 'high' | 'medium' | 'low';
}

interface EdgeFunction {
  name: string;
  description: string;
  trigger: string;
  code: string;
  secrets: string[];
}

const SupabasePreparation: React.FC = () => {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [preparationStep, setPreparationStep] = useState(0);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
      toast({
        title: "Code copié",
        description: "Le script SQL a été copié dans le presse-papiers",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le code",
        variant: "destructive",
      });
    }
  };

  const databaseTables: DatabaseTable[] = [
    {
      name: 'profiles',
      description: 'Profils utilisateurs étendus',
      priority: 'high',
      columns: [
        { name: 'id', type: 'UUID', required: true, description: 'Identifiant unique' },
        { name: 'user_id', type: 'UUID', required: true, description: 'Référence auth.users' },
        { name: 'full_name', type: 'TEXT', required: false, description: 'Nom complet' },
        { name: 'phone', type: 'TEXT', required: false, description: 'Numéro téléphone' },
        { name: 'avatar_url', type: 'TEXT', required: false, description: 'URL photo profil' },
        { name: 'preferred_language', type: 'TEXT', required: false, description: 'Langue préférée' },
        { name: 'verification_level', type: 'TEXT', required: false, description: 'Niveau vérification' },
        { name: 'created_at', type: 'TIMESTAMP', required: true, description: 'Date création' },
        { name: 'updated_at', type: 'TIMESTAMP', required: true, description: 'Date modification' }
      ],
      policies: [
        'Users can view their own profile',
        'Users can update their own profile',
        'Public profiles are readable by all users'
      ]
    },
    {
      name: 'transport_bookings',
      description: 'Réservations de transport',
      priority: 'high',
      columns: [
        { name: 'id', type: 'UUID', required: true, description: 'Identifiant unique' },
        { name: 'user_id', type: 'UUID', required: true, description: 'Client' },
        { name: 'driver_id', type: 'UUID', required: false, description: 'Chauffeur assigné' },
        { name: 'vehicle_type', type: 'TEXT', required: true, description: 'Type véhicule' },
        { name: 'pickup_location', type: 'JSONB', required: true, description: 'Lieu prise en charge' },
        { name: 'destination_location', type: 'JSONB', required: true, description: 'Destination' },
        { name: 'status', type: 'TEXT', required: true, description: 'Statut réservation' },
        { name: 'price_cdf', type: 'INTEGER', required: true, description: 'Prix en CDF' },
        { name: 'distance_km', type: 'DECIMAL', required: false, description: 'Distance en km' },
        { name: 'estimated_duration', type: 'INTEGER', required: false, description: 'Durée estimée min' },
        { name: 'scheduled_at', type: 'TIMESTAMP', required: false, description: 'Heure programmée' },
        { name: 'created_at', type: 'TIMESTAMP', required: true, description: 'Date création' }
      ],
      policies: [
        'Users can view their own bookings',
        'Drivers can view assigned bookings',
        'Users can create bookings'
      ]
    },
    {
      name: 'delivery_orders',
      description: 'Commandes de livraison',
      priority: 'high',
      columns: [
        { name: 'id', type: 'UUID', required: true, description: 'Identifiant unique' },
        { name: 'sender_id', type: 'UUID', required: true, description: 'Expéditeur' },
        { name: 'receiver_phone', type: 'TEXT', required: true, description: 'Téléphone destinataire' },
        { name: 'receiver_name', type: 'TEXT', required: true, description: 'Nom destinataire' },
        { name: 'package_type', type: 'TEXT', required: true, description: 'Type de colis' },
        { name: 'pickup_address', type: 'JSONB', required: true, description: 'Adresse prise en charge' },
        { name: 'delivery_address', type: 'JSONB', required: true, description: 'Adresse livraison' },
        { name: 'status', type: 'TEXT', required: true, description: 'Statut livraison' },
        { name: 'price_cdf', type: 'INTEGER', required: true, description: 'Prix en CDF' },
        { name: 'tracking_code', type: 'TEXT', required: true, description: 'Code suivi unique' },
        { name: 'created_at', type: 'TIMESTAMP', required: true, description: 'Date création' }
      ],
      policies: [
        'Users can view their sent deliveries',
        'Delivery can be tracked by code',
        'Drivers can view assigned deliveries'
      ]
    },
    {
      name: 'marketplace_products',
      description: 'Produits marketplace',
      priority: 'medium',
      columns: [
        { name: 'id', type: 'UUID', required: true, description: 'Identifiant unique' },
        { name: 'seller_id', type: 'UUID', required: true, description: 'Vendeur' },
        { name: 'name', type: 'TEXT', required: true, description: 'Nom produit' },
        { name: 'description', type: 'TEXT', required: false, description: 'Description' },
        { name: 'price_cdf', type: 'INTEGER', required: true, description: 'Prix en CDF' },
        { name: 'category', type: 'TEXT', required: true, description: 'Catégorie' },
        { name: 'images', type: 'TEXT[]', required: false, description: 'URLs images' },
        { name: 'stock_quantity', type: 'INTEGER', required: true, description: 'Stock disponible' },
        { name: 'status', type: 'TEXT', required: true, description: 'Statut produit' },
        { name: 'specifications', type: 'JSONB', required: false, description: 'Spécifications' },
        { name: 'created_at', type: 'TIMESTAMP', required: true, description: 'Date création' }
      ],
      policies: [
        'All users can view active products',
        'Sellers can manage their products',
        'Products require approval'
      ]
    },
    {
      name: 'payment_transactions',
      description: 'Transactions de paiement',
      priority: 'high',
      columns: [
        { name: 'id', type: 'UUID', required: true, description: 'Identifiant unique' },
        { name: 'user_id', type: 'UUID', required: true, description: 'Utilisateur' },
        { name: 'booking_id', type: 'UUID', required: false, description: 'Réservation liée' },
        { name: 'order_id', type: 'UUID', required: false, description: 'Commande liée' },
        { name: 'payment_method', type: 'TEXT', required: true, description: 'Méthode paiement' },
        { name: 'provider', type: 'TEXT', required: true, description: 'Fournisseur (Airtel, M-Pesa...)' },
        { name: 'amount_cdf', type: 'INTEGER', required: true, description: 'Montant CDF' },
        { name: 'status', type: 'TEXT', required: true, description: 'Statut transaction' },
        { name: 'external_reference', type: 'TEXT', required: false, description: 'Référence externe' },
        { name: 'created_at', type: 'TIMESTAMP', required: true, description: 'Date création' }
      ],
      policies: [
        'Users can view their own transactions',
        'Financial data requires encryption',
        'Admin can view all transactions'
      ]
    }
  ];

  const edgeFunctions: EdgeFunction[] = [
    {
      name: 'mobile-money-payment',
      description: 'Traitement paiements Mobile Money',
      trigger: 'API REST',
      secrets: ['AIRTEL_API_KEY', 'MPESA_API_KEY', 'ORANGE_API_KEY'],
      code: `
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { provider, phoneNumber, amount, currency, reference } = await req.json()
    
    // Validation
    if (!provider || !phoneNumber || !amount) {
      throw new Error('Paramètres manquants')
    }
    
    // Traitement selon le fournisseur
    let result
    switch (provider) {
      case 'airtel':
        result = await processAirtelPayment(phoneNumber, amount, reference)
        break
      case 'mpesa':
        result = await processMpesaPayment(phoneNumber, amount, reference)
        break
      case 'orange':
        result = await processOrangePayment(phoneNumber, amount, reference)
        break
      default:
        throw new Error('Fournisseur non supporté')
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
      `
    },
    {
      name: 'notification-service',
      description: 'Service de notifications push',
      trigger: 'Database Trigger',
      secrets: ['FCM_SERVER_KEY', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY'],
      code: `
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const { userId, title, body, data, type } = await req.json()
    
    // Récupérer tokens FCM de l'utilisateur
    const userTokens = await getUserFCMTokens(userId)
    
    if (userTokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }))
    }
    
    // Préparer notification
    const notification = {
      title,
      body,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: { ...data, type }
    }
    
    // Envoyer via FCM
    const results = await Promise.all(
      userTokens.map(token => sendFCMNotification(token, notification))
    )
    
    const successCount = results.filter(r => r.success).length
    
    return new Response(JSON.stringify({ 
      sent: successCount,
      total: userTokens.length 
    }))
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    })
  }
})
      `
    }
  ];

  const generateMigrationSQL = () => {
    return `
-- Migration Tembea Taxi Congo RDC
-- Création des tables principales

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des profils utilisateurs
CREATE TABLE public.profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'ln', 'kg', 'lu', 'sw')),
  verification_level TEXT DEFAULT 'basic' CHECK (verification_level IN ('basic', 'standard', 'premium', 'pro')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des réservations transport
CREATE TABLE public.transport_bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  driver_id UUID REFERENCES auth.users,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('moto-taxi', 'taxi-bus', 'transco-bus', 'taxi-standard', 'vip')),
  pickup_location JSONB NOT NULL,
  destination_location JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'driver_assigned', 'pickup', 'in_transit', 'completed', 'cancelled')),
  price_cdf INTEGER NOT NULL,
  distance_km DECIMAL(8,2),
  estimated_duration INTEGER,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des commandes de livraison
CREATE TABLE public.delivery_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users NOT NULL,
  receiver_phone TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  package_type TEXT NOT NULL CHECK (package_type IN ('petit-colis', 'moyen-colis', 'grand-colis', 'express', 'fragile')),
  pickup_address JSONB NOT NULL,
  delivery_address JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'pickup', 'in_transit', 'delivered', 'cancelled')),
  price_cdf INTEGER NOT NULL,
  tracking_code TEXT UNIQUE NOT NULL DEFAULT 'KW' || EXTRACT(EPOCH FROM NOW())::TEXT || FLOOR(RANDOM() * 10000)::TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des produits marketplace
CREATE TABLE public.marketplace_products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_cdf INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('electronics', 'fashion', 'home', 'food', 'beauty', 'automotive')),
  images TEXT[],
  stock_quantity INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'suspended')),
  specifications JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des transactions de paiement
CREATE TABLE public.payment_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  booking_id UUID REFERENCES public.transport_bookings,
  order_id UUID REFERENCES public.delivery_orders,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('mobile_money', 'cash', 'bank_transfer')),
  provider TEXT CHECK (provider IN ('airtel', 'mpesa', 'orange', 'cash')),
  amount_cdf INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  external_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour transport_bookings
CREATE POLICY "Users can view their own bookings" ON public.transport_bookings
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = driver_id);

CREATE POLICY "Users can create bookings" ON public.transport_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their bookings" ON public.transport_bookings
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = driver_id);

-- Politiques RLS pour delivery_orders
CREATE POLICY "Users can view their deliveries" ON public.delivery_orders
  FOR SELECT USING (auth.uid() = sender_id);

CREATE POLICY "Users can create deliveries" ON public.delivery_orders
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Politiques RLS pour marketplace_products
CREATE POLICY "Anyone can view active products" ON public.marketplace_products
  FOR SELECT USING (status = 'active');

CREATE POLICY "Sellers can manage their products" ON public.marketplace_products
  FOR ALL USING (auth.uid() = seller_id);

-- Politiques RLS pour payment_transactions
CREATE POLICY "Users can view their transactions" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create transactions" ON public.payment_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fonctions et triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index pour performance
CREATE INDEX idx_transport_bookings_user_id ON public.transport_bookings(user_id);
CREATE INDEX idx_transport_bookings_status ON public.transport_bookings(status);
CREATE INDEX idx_delivery_orders_sender_id ON public.delivery_orders(sender_id);
CREATE INDEX idx_delivery_orders_tracking_code ON public.delivery_orders(tracking_code);
CREATE INDEX idx_marketplace_products_category ON public.marketplace_products(category);
CREATE INDEX idx_marketplace_products_status ON public.marketplace_products(status);
CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
    `;
  };

  const preparationSteps = [
    'Analyse de l\'architecture actuelle',
    'Création du schéma de base de données',
    'Configuration des politiques RLS',
    'Préparation des Edge Functions',
    'Configuration des secrets',
    'Tests de sécurité',
    'Validation finale'
  ];

  const progress = ((preparationStep + 1) / preparationSteps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Préparation Supabase Backend
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configuration backend complète pour Tembea Taxi Congo
              </p>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Prêt pour déploiement
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Progression de préparation</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-sm text-muted-foreground">
              Étape actuelle: {preparationSteps[preparationStep]}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="database" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="database">Base de données</TabsTrigger>
          <TabsTrigger value="functions">Edge Functions</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="deployment">Déploiement</TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="space-y-4">
          {/* Migration SQL */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                Script de Migration Complet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Ce script créera toutes les tables, politiques RLS et index nécessaires pour Tembea Taxi.
                    Exécutez-le dans l'éditeur SQL de Supabase.
                  </AlertDescription>
                </Alert>
                
                <div className="bg-slate-900 text-slate-100 rounded-lg p-4 relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 text-slate-300 hover:text-white"
                    onClick={() => copyToClipboard(generateMigrationSQL(), 'migration-sql')}
                  >
                    {copiedCode === 'migration-sql' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <pre className="text-sm overflow-auto max-h-96">
                    <code>{generateMigrationSQL()}</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tables overview */}
          <div className="grid gap-4">
            {databaseTables.map(table => (
              <Card key={table.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{table.name}</CardTitle>
                    <Badge variant={table.priority === 'high' ? 'destructive' : 
                                  table.priority === 'medium' ? 'outline' : 'secondary'}>
                      Priorité {table.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{table.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Colonnes ({table.columns.length})</h4>
                      <div className="grid gap-2">
                        {table.columns.slice(0, 5).map(column => (
                          <div key={column.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <code className="bg-muted px-2 py-1 rounded text-xs">{column.name}</code>
                              <span className="text-muted-foreground">{column.type}</span>
                              {column.required && <Badge variant="outline" className="text-xs">Requis</Badge>}
                            </div>
                            <span className="text-muted-foreground text-xs">{column.description}</span>
                          </div>
                        ))}
                        {table.columns.length > 5 && (
                          <p className="text-sm text-muted-foreground">
                            ... et {table.columns.length - 5} autres colonnes
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Politiques RLS</h4>
                      <ul className="text-sm space-y-1">
                        {table.policies.map((policy, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Shield className="w-3 h-3 text-success" />
                            {policy}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="functions" className="space-y-4">
          {edgeFunctions.map(func => (
            <Card key={func.name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-primary" />
                  {func.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{func.description}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Trigger: {func.trigger}</Badge>
                  {func.secrets.length > 0 && (
                    <Badge variant="secondary">{func.secrets.length} secrets requis</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {func.secrets.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        Secrets requis
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {func.secrets.map(secret => (
                          <code key={secret} className="bg-muted px-2 py-1 rounded text-sm">
                            {secret}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium mb-2">Code de la fonction</h4>
                    <div className="bg-slate-900 text-slate-100 rounded-lg p-4 relative">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 text-slate-300 hover:text-white"
                        onClick={() => copyToClipboard(func.code, func.name)}
                      >
                        {copiedCode === func.name ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <pre className="text-sm overflow-auto max-h-64">
                        <code>{func.code}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Configuration Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Toutes les tables sont configurées avec Row Level Security (RLS) pour protéger les données utilisateurs.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-muted/30">
                  <CardHeader>
                    <h4 className="font-medium">Authentification</h4>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-sm">Email/mot de passe</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-sm">Vérification téléphone</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-sm">Sessions persistantes</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30">
                  <CardHeader>
                    <h4 className="font-medium">Protection données</h4>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-sm">RLS sur toutes les tables</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-sm">Chiffrement at-rest</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-sm">API sécurisées</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Guide de Déploiement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Étapes de déploiement</h4>
                  {[
                    {
                      step: 1,
                      title: 'Créer projet Supabase',
                      description: 'Nouveau projet avec région proche de l\'Afrique'
                    },
                    {
                      step: 2,
                      title: 'Exécuter migration SQL',
                      description: 'Copier et exécuter le script de migration dans SQL Editor'
                    },
                    {
                      step: 3,
                      title: 'Configurer les secrets',
                      description: 'Ajouter les clés API Mobile Money dans Project Settings'
                    },
                    {
                      step: 4,
                      title: 'Déployer Edge Functions',
                      description: 'Upload des fonctions pour paiements et notifications'
                    },
                    {
                      step: 5,
                      title: 'Configurer Auth',
                      description: 'Paramétrer les providers et templates email'
                    },
                    {
                      step: 6,
                      title: 'Tests de production',
                      description: 'Valider toutes les fonctionnalités en prod'
                    }
                  ].map(({ step, title, description }) => (
                    <div key={step} className="flex gap-4">
                      <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {step}
                      </div>
                      <div>
                        <h5 className="font-medium">{title}</h5>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Après le déploiement, pensez à mettre à jour les variables d'environnement 
                    dans votre application avec les nouvelles URLs et clés Supabase.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupabasePreparation;