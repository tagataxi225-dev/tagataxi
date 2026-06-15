import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export const TestDataGenerator: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const generateMarketplaceProducts = async () => {
    if (!user) {
      toast({ title: "Erreur", description: "Vous devez être connecté", variant: "destructive" });
      return;
    }

    const products = [
      {
        seller_id: user.id,
        title: 'Smartphone Samsung Galaxy A54',
        description: 'Téléphone neuf avec garantie, 128GB de stockage, écran AMOLED 6.4 pouces',
        price: 450000,
        category: 'electronique',
        subcategory: 'smartphones',
        condition: 'new',
        location: 'Gombe, Kinshasa',
        coordinates: { lat: -4.4419, lng: 15.2663 },
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'],
        status: 'active'
      },
      {
        seller_id: user.id,
        title: 'Ordinateur portable HP Pavilion',
        description: 'Laptop performant pour le travail et les études, Intel i5, 8GB RAM, 256GB SSD',
        price: 650000,
        category: 'electronique',
        subcategory: 'ordinateurs',
        condition: 'new',
        location: 'Kalamu, Kinshasa',
        coordinates: { lat: -4.4500, lng: 15.2800 },
        images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400'],
        status: 'active'
      },
      {
        seller_id: user.id,
        title: 'Réfrigérateur LG 300L',
        description: 'Réfrigérateur neuf avec congélateur, classe énergétique A+, très économique',
        price: 380000,
        category: 'electromenager',
        subcategory: 'refrigerateurs',
        condition: 'new',
        location: 'Lemba, Kinshasa',
        coordinates: { lat: -4.4300, lng: 15.2900 },
        images: ['https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400'],
        status: 'active'
      },
      {
        seller_id: user.id,
        title: 'Canapé 3 places moderne',
        description: 'Canapé confortable en tissu, couleur grise, parfait pour salon',
        price: 250000,
        category: 'mobilier',
        subcategory: 'salon',
        condition: 'new',
        location: 'Ngaliema, Kinshasa',
        coordinates: { lat: -4.4200, lng: 15.2400 },
        images: ['https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400'],
        status: 'active'
      },
      {
        seller_id: user.id,
        title: 'Vélo de ville Decathlon',
        description: 'Vélo 21 vitesses, très bon état, idéal pour les déplacements en ville',
        price: 120000,
        category: 'sport',
        subcategory: 'velos',
        condition: 'good',
        location: 'Matete, Kinshasa',
        coordinates: { lat: -4.4100, lng: 15.3100 },
        images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400'],
        status: 'active'
      },
      {
        seller_id: user.id,
        title: 'PlayStation 5 + jeux',
        description: 'Console PS5 avec 2 manettes et 5 jeux inclus, état parfait',
        price: 750000,
        category: 'electronique',
        subcategory: 'consoles',
        condition: 'good',
        location: 'Ndjili, Kinshasa',
        coordinates: { lat: -4.3900, lng: 15.3300 },
        images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400'],
        status: 'active'
      }
    ];

    try {
      const { error } = await supabase
        .from('marketplace_products')
        .insert(products);

      if (error) throw error;

      toast({ 
        title: "Succès", 
        description: `${products.length} produits créés avec succès!` 
      });
    } catch (error) {
      console.error('Error creating products:', error);
      toast({ 
        title: "Erreur", 
        description: "Erreur lors de la création des produits", 
        variant: "destructive" 
      });
    }
  };

  const generateUserProfile = async () => {
    if (!user) return;

    try {
      // Create or update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: 'Utilisateur Test',
          phone_number: '+243970123456',
          user_type: 'client'
        });

      if (profileError) throw profileError;

      // Create wallet
      const { error: walletError } = await supabase
        .from('user_wallets')
        .upsert({
          user_id: user.id,
          balance: 50000,
          currency: 'CDF',
          is_active: true
        });

      if (walletError) throw walletError;

      // Create some places
      const places = [
        {
          user_id: user.id,
          name: 'Domicile',
          address: 'Avenue Kasavubu, Gombe',
          coordinates: { lat: -4.4419, lng: 15.2663 },
          place_type: 'home'
        },
        {
          user_id: user.id,
          name: 'Bureau',
          address: 'Boulevard du 30 Juin, Gombe',
          coordinates: { lat: -4.4400, lng: 15.2700 },
          place_type: 'work'
        }
      ];

      const { error: placesError } = await supabase
        .from('user_places')
        .upsert(places);

      if (placesError) throw placesError;

      toast({ 
        title: "Succès", 
        description: "Profil utilisateur créé avec succès!" 
      });
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({ 
        title: "Erreur", 
        description: "Erreur lors de la création du profil", 
        variant: "destructive" 
      });
    }
  };

  const generateAllTestData = async () => {
    setIsGenerating(true);
    try {
      await generateUserProfile();
      await generateMarketplaceProducts();
      
      toast({ 
        title: "Succès", 
        description: "Toutes les données de test ont été générées!" 
      });
    } catch (error) {
      console.error('Error generating test data:', error);
      toast({ 
        title: "Erreur", 
        description: "Erreur lors de la génération des données", 
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Générateur de données de test</CardTitle>
          <CardDescription>
            Vous devez être connecté pour générer des données de test
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Générateur de données de test</CardTitle>
        <CardDescription>
          Générez des données de test pour tester l'application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={generateUserProfile} 
          className="w-full"
          variant="outline"
        >
          Créer profil utilisateur
        </Button>
        
        <Button 
          onClick={generateMarketplaceProducts} 
          className="w-full"
          variant="outline"
        >
          Créer produits marketplace
        </Button>
        
        <Button 
          onClick={generateAllTestData} 
          className="w-full"
          disabled={isGenerating}
        >
          {isGenerating ? 'Génération...' : 'Tout générer'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TestDataGenerator;