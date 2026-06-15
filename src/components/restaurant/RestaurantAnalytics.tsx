import ModernRestaurantAnalytics from '@/pages/restaurant/ModernRestaurantAnalytics';

interface RestaurantAnalyticsProps {
  restaurantId: string;
}

export function RestaurantAnalytics({ restaurantId }: RestaurantAnalyticsProps) {
  return <ModernRestaurantAnalytics restaurantId={restaurantId} />;
}
