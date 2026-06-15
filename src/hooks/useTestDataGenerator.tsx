import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestDataStats {
  users: number;
  drivers: number;
  transportBookings: number;
  deliveryOrders: number;
  marketplaceProducts: number;
  marketplaceOrders: number;
}

export const useTestDataGenerator = () => {
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState<TestDataStats | null>(null);
  const { toast } = useToast();

  const generateTestUsers = async (count: number = 50) => {
    const users = [];
    const cities = ['Kinshasa', 'Lubumbashi', 'Kolwezi'];
    const firstNames = ['Jean', 'Marie', 'Pierre', 'Lucie', 'Paul', 'Sophie', 'Michel', 'Anne', 'Robert', 'Claire'];
    const lastNames = ['Mukendi', 'Kabila', 'Tshisekedi', 'Ngozi', 'Bemba', 'Kamitatu', 'Katumbi', 'Mwanza'];

    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      
      users.push({
        display_name: `${firstName} ${lastName}`,
        phone_number: `+243${Math.floor(Math.random() * 900000000 + 100000000)}`,
        city: city,
        user_type: Math.random() > 0.8 ? 'driver' : 'client',
        status: Math.random() > 0.1 ? 'active' : 'inactive',
        avatar_url: null,
        date_of_birth: null,
        emergency_contact: null,
        preferred_language: 'fr'
      });
    }

    const { error } = await supabase.from('profiles').insert(users);
    if (error) throw error;
    return users.length;
  };

  const generateTestDrivers = async (count: number = 15) => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_type', 'driver')
      .limit(count);

    if (!profiles?.length) return 0;

    const drivers = [];
    const vehicleModels = ['Toyota Corolla', 'Honda Civic', 'Nissan Sentra', 'Hyundai Elantra', 'Mitsubishi Lancer'];
    const vehicleMakes = ['Toyota', 'Honda', 'Nissan', 'Hyundai', 'Mitsubishi'];
    const serviceTypes = ['taxi', 'delivery', 'moto'];

    for (const profile of profiles) {
      const vehicleModel = vehicleModels[Math.floor(Math.random() * vehicleModels.length)];
      const vehicleMake = vehicleMakes[Math.floor(Math.random() * vehicleMakes.length)];
      
      drivers.push({
        user_id: profile.user_id,
        license_number: `LIC${Math.floor(Math.random() * 900000 + 100000)}`,
        license_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        insurance_number: `INS${Math.floor(Math.random() * 900000 + 100000)}`,
        insurance_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        vehicle_year: 2018 + Math.floor(Math.random() * 6),
        vehicle_plate: `KIN${Math.floor(Math.random() * 9000 + 1000)}`,
        vehicle_color: ['Blanc', 'Noir', 'Bleu', 'Rouge', 'Gris'][Math.floor(Math.random() * 5)],
        vehicle_class: ['standard', 'premium', 'economy'][Math.floor(Math.random() * 3)],
        service_type: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
        is_active: Math.random() > 0.2,
        verification_status: ['verified', 'pending', 'rejected'][Math.floor(Math.random() * 3)],
        rating_average: 3.5 + Math.random() * 1.5,
        rating_count: Math.floor(Math.random() * 50 + 5),
        total_rides: Math.floor(Math.random() * 200 + 10)
      });
    }

    const { error } = await supabase.from('driver_profiles').insert(drivers);
    if (error) throw error;
    return drivers.length;
  };

  const generateTestBookings = async (count: number = 100) => {
    const { data: users } = await supabase.from('profiles').select('user_id').limit(30);
    const { data: drivers } = await supabase.from('driver_profiles').select('user_id').limit(10);
    
    if (!users?.length || !drivers?.length) return 0;

    const bookings = [];
    const statuses = ['completed', 'cancelled', 'pending', 'in_progress'];
    const locations = [
      'Gombe, Kinshasa', 'Kalamu, Kinshasa', 'Lemba, Kinshasa', 
      'Matete, Kinshasa', 'Ngaba, Kinshasa', 'Lubumbashi Centre'
    ];

    for (let i = 0; i < count; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const driver = drivers[Math.floor(Math.random() * drivers.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const basePrice = 2000 + Math.random() * 8000;
      
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      bookings.push({
        user_id: user.user_id,
        driver_id: Math.random() > 0.3 ? driver.user_id : null,
        pickup_location: locations[Math.floor(Math.random() * locations.length)],
        destination_location: locations[Math.floor(Math.random() * locations.length)],
        vehicle_class: ['standard', 'premium', 'economy'][Math.floor(Math.random() * 3)],
        estimated_price: Math.round(basePrice),
        actual_price: status === 'completed' ? Math.round(basePrice * (0.9 + Math.random() * 0.2)) : null,
        status: status,
        created_at: createdAt.toISOString(),
        updated_at: createdAt.toISOString(),
        pickup_time: status !== 'pending' ? new Date(createdAt.getTime() + Math.random() * 60 * 60 * 1000).toISOString() : null,
        completed_at: status === 'completed' ? new Date(createdAt.getTime() + Math.random() * 120 * 60 * 1000).toISOString() : null,
        customer_rating: status === 'completed' ? Math.floor(3 + Math.random() * 3) : null
      });
    }

    const { error } = await supabase.from('transport_bookings').insert(bookings);
    if (error) throw error;
    return bookings.length;
  };

  const generateTestDeliveries = async (count: number = 50) => {
    const { data: users } = await supabase.from('profiles').select('user_id').limit(20);
    const { data: drivers } = await supabase.from('driver_profiles').select('user_id').limit(8);
    
    if (!users?.length || !drivers?.length) return 0;

    const deliveries = [];
    const deliveryTypes = ['flash', 'standard', 'express'];
    const packageTypes = ['document', 'package', 'food', 'electronics'];
    const statuses = ['completed', 'cancelled', 'pending', 'in_progress'];

    for (let i = 0; i < count; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const driver = drivers[Math.floor(Math.random() * drivers.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const basePrice = 3000 + Math.random() * 5000;
      
      const createdAt = new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000);
      
      deliveries.push({
        user_id: user.user_id,
        driver_id: Math.random() > 0.4 ? driver.user_id : null,
        pickup_location: 'Gombe, Kinshasa',
        delivery_location: 'Lemba, Kinshasa',
        delivery_type: deliveryTypes[Math.floor(Math.random() * deliveryTypes.length)],
        package_type: packageTypes[Math.floor(Math.random() * packageTypes.length)],
        estimated_price: Math.round(basePrice),
        actual_price: status === 'completed' ? Math.round(basePrice * (0.9 + Math.random() * 0.2)) : null,
        status: status,
        created_at: createdAt.toISOString(),
        updated_at: createdAt.toISOString(),
        pickup_time: status !== 'pending' ? new Date(createdAt.getTime() + Math.random() * 30 * 60 * 1000).toISOString() : null,
        delivery_time: status === 'completed' ? new Date(createdAt.getTime() + Math.random() * 90 * 60 * 1000).toISOString() : null
      });
    }

    const { error } = await supabase.from('delivery_orders').insert(deliveries);
    if (error) throw error;
    return deliveries.length;
  };

  const generateTestMarketplace = async () => {
    const { data: users } = await supabase.from('profiles').select('user_id').limit(15);
    if (!users?.length) return { products: 0, orders: 0 };

    // Générer des produits
    const products = [];
    const categories = ['electronique', 'vetements', 'maison', 'beaute', 'sport'];
    const productNames = [
      'Smartphone Samsung', 'Ordinateur portable', 'Chaussures Nike', 'Robe élégante',
      'Télévision LED', 'Casque audio', 'Parfum', 'Livre cuisine', 'Sac à main'
    ];

    for (let i = 0; i < 30; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const name = productNames[Math.floor(Math.random() * productNames.length)];
      
      products.push({
        seller_id: user.user_id,
        title: `${name} ${i + 1}`,
        description: `Excellent ${name.toLowerCase()} en parfait état`,
        price: 50000 + Math.random() * 500000,
        category: categories[Math.floor(Math.random() * categories.length)],
        condition: ['new', 'like_new', 'good'][Math.floor(Math.random() * 3)],
        status: Math.random() > 0.1 ? 'active' : 'inactive',
        moderation_status: ['approved', 'pending', 'rejected'][Math.floor(Math.random() * 3)],
        location: 'Kinshasa, RDC'
      });
    }

    const { data: insertedProducts, error: productsError } = await supabase
      .from('marketplace_products')
      .insert(products)
      .select('id, seller_id');
    
    if (productsError) throw productsError;

    // Générer des commandes
    const orders = [];
    for (let i = 0; i < 20; i++) {
      const product = insertedProducts![Math.floor(Math.random() * insertedProducts!.length)];
      const buyer = users[Math.floor(Math.random() * users.length)];
      
      if (buyer.user_id !== product.seller_id) {
        const quantity = Math.floor(Math.random() * 3) + 1;
        const unitPrice = 50000 + Math.random() * 200000;
        
        orders.push({
          buyer_id: buyer.user_id,
          seller_id: product.seller_id,
          product_id: product.id,
          quantity: quantity,
          unit_price: unitPrice,
          total_amount: quantity * unitPrice,
          status: ['pending', 'confirmed', 'completed', 'cancelled'][Math.floor(Math.random() * 4)],
          delivery_method: ['pickup', 'delivery'][Math.floor(Math.random() * 2)]
        });
      }
    }

    const { error: ordersError } = await supabase.from('marketplace_orders').insert(orders);
    if (ordersError) throw ordersError;

    return { products: products.length, orders: orders.length };
  };

  const generateActivityLogs = async (count: number = 100) => {
    const { data: users } = await supabase.from('profiles').select('user_id').limit(30);
    if (!users?.length) return 0;

    const logs = [];
    const activityTypes = [
      'user_registration', 'driver_application', 'booking_created', 'booking_completed',
      'delivery_created', 'delivery_completed', 'marketplace_purchase', 'wallet_topup'
    ];

    for (let i = 0; i < count; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      
      logs.push({
        user_id: user.user_id,
        activity_type: activityType,
        description: `${activityType.replace('_', ' ')} - Test data`,
        amount: ['wallet_topup', 'booking_completed', 'delivery_completed'].includes(activityType) 
          ? Math.round(1000 + Math.random() * 10000) : null,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    const { error } = await supabase.from('activity_logs').insert(logs);
    if (error) throw error;
    return logs.length;
  };

  const generateAllTestData = async () => {
    try {
      setGenerating(true);
      
      toast({
        title: "Génération des données",
        description: "Création des données de test en cours...",
      });

      // Générer les données par étapes
      const usersCount = await generateTestUsers(50);
      const driversCount = await generateTestDrivers(15);
      const bookingsCount = await generateTestBookings(100);
      const deliveriesCount = await generateTestDeliveries(50);
      const marketplaceData = await generateTestMarketplace();
      const logsCount = await generateActivityLogs(100);

      const finalStats = {
        users: usersCount,
        drivers: driversCount,
        transportBookings: bookingsCount,
        deliveryOrders: deliveriesCount,
        marketplaceProducts: marketplaceData.products,
        marketplaceOrders: marketplaceData.orders
      };

      setStats(finalStats);

      toast({
        title: "Données générées avec succès",
        description: `${usersCount} utilisateurs, ${driversCount} chauffeurs, ${bookingsCount} réservations créées`,
      });

      return finalStats;
    } catch (error) {
      console.error('Erreur génération données:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération des données de test",
        variant: "destructive"
      });
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  const clearTestData = async () => {
    try {
      setGenerating(true);
      
      // Supprimer les données dans l'ordre correct (contraintes FK)
      await supabase.from('activity_logs').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('marketplace_orders').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('marketplace_products').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('delivery_orders').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('transport_bookings').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('driver_profiles').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('profiles').delete().gte('user_id', '00000000-0000-0000-0000-000000000000');

      setStats(null);
      
      toast({
        title: "Données supprimées",
        description: "Toutes les données de test ont été supprimées",
      });
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression des données",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  return {
    generating,
    stats,
    generateAllTestData,
    clearTestData
  };
};