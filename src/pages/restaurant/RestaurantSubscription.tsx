// Ce fichier redirige vers la nouvelle page d'abonnement intégrée
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function RestaurantSubscription() {
  const navigate = useNavigate();

  useEffect(() => {
    // Rediriger vers l'espace restaurant avec l'onglet abonnement
    navigate('/restaurant?tab=subscription', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
