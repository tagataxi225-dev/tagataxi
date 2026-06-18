import { useParams, useNavigate } from 'react-router-dom';
import { FoodOrderTracking } from '@/components/food/FoodOrderTracking';
import { useEffect } from 'react';

export default function FoodTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Suivi de commande - TAGA Food';
  }, []);

  if (!orderId) {
    navigate('/food/orders');
    return null;
  }

  return (
    <FoodOrderTracking 
      orderId={orderId} 
      onBack={() => navigate('/food/orders')} 
    />
  );
}
