import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { RestaurantEscrowDashboard } from '@/components/food/escrow';

export default function RestaurantEscrowPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-24 md:pb-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/restaurant')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Gestion Escrow</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Suivi de vos paiements sécurisés
            </p>
          </div>
        </div>

        {/* Dashboard Escrow */}
        <RestaurantEscrowDashboard />
      </div>
    </div>
  );
}
