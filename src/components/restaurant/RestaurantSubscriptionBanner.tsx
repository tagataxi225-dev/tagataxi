import { useNavigate } from 'react-router-dom';
import { Crown, Shield, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RestaurantSubscriptionBannerProps {
  isSubscribed?: boolean;
  planName?: string;
  daysRemaining?: number;
}

export function RestaurantSubscriptionBanner({ 
  isSubscribed = false, 
  planName = 'Pro',
  daysRemaining = 0 
}: RestaurantSubscriptionBannerProps) {
  const navigate = useNavigate();

  if (isSubscribed) {
    return (
      <button
        onClick={() => navigate('/restaurant/subscription')}
        className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between transition-all hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
            <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-emerald-900 dark:text-emerald-100">
              Plan {planName}
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              {daysRemaining > 0 ? `${daysRemaining} jours restants` : 'Renouvellement automatique'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <span className="text-sm font-medium">Gérer</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate('/restaurant/subscription')}
      className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between transition-all hover:shadow-md group"
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-full bg-amber-100 dark:bg-amber-900/50">
          <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="text-left">
          <p className="font-semibold text-amber-900 dark:text-amber-100">
            Pas encore abonné
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Débloquez toutes les fonctionnalités
          </p>
        </div>
      </div>
      <Button 
        size="sm" 
        className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm group-hover:shadow-md transition-all"
      >
        S'abonner
      </Button>
    </button>
  );
}
