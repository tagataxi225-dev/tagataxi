import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InventoryItem {
  id: string;
  restaurant_id: string;
  product_id: string;
  current_stock: number;
  minimum_stock: number;
  unit_cost: number;
  low_stock_alert: boolean;
  last_restocked_at: string | null;
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
    main_image_url: string | null;
  };
}

export const usePOSInventory = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const getInventory = async (restaurantId: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('restaurant_inventory')
        .select(`
          *,
          product:food_products(id, name, price, category, main_image_url)
        `)
        .eq('restaurant_id', restaurantId)
        .order('low_stock_alert', { ascending: false })
        .order('current_stock', { ascending: true });

      if (error) throw error;
      return (data || []) as InventoryItem[];
    } catch (error: any) {
      console.error('Error getting inventory:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (
    inventoryId: string,
    quantity: number,
    movementType: 'in' | 'out' | 'adjustment' | 'waste',
    notes?: string
  ) => {
    try {
      setLoading(true);

      // Récupérer l'inventaire actuel
      const { data: inventory, error: invError } = await supabase
        .from('restaurant_inventory')
        .select('*')
        .eq('id', inventoryId)
        .single();

      if (invError || !inventory) throw new Error('Inventaire non trouvé');

      const previousStock = inventory.current_stock;
      const newStock = movementType === 'in' || movementType === 'adjustment'
        ? previousStock + quantity
        : previousStock - quantity;

      // Mettre à jour l'inventaire
      const { error: updateError } = await supabase
        .from('restaurant_inventory')
        .update({
          current_stock: newStock,
          low_stock_alert: newStock <= inventory.minimum_stock,
          last_restocked_at: movementType === 'in' ? new Date().toISOString() : inventory.last_restocked_at,
        })
        .eq('id', inventoryId);

      if (updateError) throw updateError;

      // Logger le mouvement
      await supabase
        .from('restaurant_stock_movements')
        .insert({
          inventory_id: inventoryId,
          restaurant_id: inventory.restaurant_id,
          product_id: inventory.product_id,
          movement_type: movementType,
          quantity: movementType === 'in' ? quantity : -quantity,
          previous_stock: previousStock,
          new_stock: newStock,
          notes: notes || null,
        } as any);

      toast({
        title: '✅ Stock mis à jour',
        description: `${movementType === 'in' ? 'Ajout' : 'Retrait'} de ${quantity} unités`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const initializeInventory = async (restaurantId: string, productId: string, initialStock: number = 0) => {
    try {
      const { error } = await supabase
        .from('restaurant_inventory')
        .insert({
          restaurant_id: restaurantId,
          product_id: productId,
          current_stock: initialStock,
          minimum_stock: 10,
        } as any);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error initializing inventory:', error);
      return false;
    }
  };

  const getLowStockItems = async (restaurantId: string) => {
    try {
      const { data, error } = await supabase
        .from('restaurant_inventory')
        .select(`
          *,
          product:food_products(id, name, price, category, main_image_url)
        `)
        .eq('restaurant_id', restaurantId)
        .eq('low_stock_alert', true);

      if (error) throw error;
      return (data || []) as InventoryItem[];
    } catch (error: any) {
      console.error('Error getting low stock items:', error);
      return [];
    }
  };

  return {
    loading,
    getInventory,
    updateStock,
    initializeInventory,
    getLowStockItems,
  };
};
