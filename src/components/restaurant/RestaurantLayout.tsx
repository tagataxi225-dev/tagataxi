import { ReactNode } from 'react';
import { RestaurantHeader } from './RestaurantHeader';

interface RestaurantLayoutProps {
  children: ReactNode;
}

export function RestaurantLayout({ children }: RestaurantLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <RestaurantHeader />
      <main className="pt-6">
        {children}
      </main>
    </div>
  );
}
