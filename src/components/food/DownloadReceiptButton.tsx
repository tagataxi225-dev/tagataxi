import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { generateFoodReceipt } from '@/services/foodReceiptPDF';
import { toast } from 'sonner';

interface DownloadReceiptButtonProps {
  orderId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const DownloadReceiptButton = ({ 
  orderId, 
  variant = 'outline',
  size = 'default',
  className = ''
}: DownloadReceiptButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);

      // 1. Fetch order (no joins)
      const { data: order, error: orderError } = await supabase
        .from('food_orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (orderError) throw orderError;
      if (!order) throw new Error('Commande introuvable');

      // 2. Fetch restaurant separately
      const { data: restaurant } = await supabase
        .from('restaurant_profiles')
        .select('restaurant_name, address, phone_number')
        .eq('id', order.restaurant_id)
        .maybeSingle();

      // 3. Fetch customer profile separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, phone_number')
        .eq('id', order.customer_id)
        .maybeSingle();

      const receiptData = {
        orderNumber: order.order_number,
        orderDate: order.created_at,
        customerName: profile?.display_name || 'Client Tembea',
        customerPhone: profile?.phone_number || order.delivery_phone || 'N/A',
        restaurantName: restaurant?.restaurant_name || 'Restaurant',
        restaurantAddress: restaurant?.address || '',
        restaurantPhone: restaurant?.phone_number || '',
        items: (order.items as any[]).map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.price * item.quantity
        })),
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.delivery_fee || 0),
        serviceFee: Number(order.service_fee || 0),
        totalAmount: Number(order.total_amount),
        currency: order.currency || 'CDF',
        deliveryAddress: order.delivery_address || 'Non specifie',
        paymentMethod: order.payment_method || 'kwenda_pay',
        status: order.status
      };

      await generateFoodReceipt(receiptData);

      toast.success('Recu telecharge !', {
        description: `Fichier : kwenda-food-recu-${order.order_number}.pdf`
      });

    } catch (error: any) {
      console.error('Error generating receipt:', error);
      toast.error('Erreur de generation', {
        description: error.message || 'Impossible de generer le recu'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generation...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Telecharger le recu
        </>
      )}
    </Button>
  );
};
