import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingStats } from '@/hooks/useBookingManagement';
import { Car, Clock, CheckCircle, XCircle, Activity, DollarSign } from 'lucide-react';

interface BookingStatsCardsProps {
  stats: BookingStats;
}

export const BookingStatsCards: React.FC<BookingStatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Total Courses',
      value: stats.totalBookings,
      icon: Car,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'En Attente',
      value: stats.pendingBookings,
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      title: 'En Cours',
      value: stats.activeBookings,
      icon: Activity,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      title: 'Complétées',
      value: stats.completedBookings,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      title: 'Annulées',
      value: stats.cancelledBookings,
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      title: 'Revenus Total',
      value: `${stats.totalRevenue.toLocaleString()} CDF`,
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      isRevenue: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="card-floating border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-body-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-heading-md font-bold ${card.isRevenue ? 'text-emerald-600' : ''}`}>
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
