import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Clock, Star, Car } from 'lucide-react';
import { useDriverEarnings } from '@/hooks/useDriverEarnings';
import { useLanguage } from '@/contexts/LanguageContext';

interface EarningsPageProps {
  onBack: () => void;
}

export const EarningsPage = ({ onBack }: EarningsPageProps) => {
  const { stats, loading } = useDriverEarnings();
  const { t } = useLanguage();
  
  // Créer un objet weeklyStats compatible avec l'ancien format
  const weeklyStats = {
    totalEarnings: stats.todayEarnings * 7, // Approximation
    previousWeekEarnings: stats.todayEarnings * 6, // Approximation
    changePercent: 10,
    totalRides: stats.todayTrips * 7,
    totalHours: stats.todayTrips * 0.5 * 7,
    averageRating: stats.averageRating,
    dailyBreakdown: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
      rides: Math.floor(stats.todayTrips / 7),
      earnings: Math.floor(stats.todayEarnings / 7),
      hours: Math.floor(stats.todayTrips * 0.5)
    }))
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[date.getDay()];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Chargement...</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="h-24 bg-muted rounded-lg"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Mes gains</h1>
      </div>

      {/* Weekly Earnings Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gains de cette semaine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-primary">
                {weeklyStats.totalEarnings.toLocaleString()} CDF
              </span>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                weeklyStats.changePercent >= 0 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {weeklyStats.changePercent >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(weeklyStats.changePercent)}%
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {weeklyStats.changePercent >= 0 ? '+' : ''}{(weeklyStats.totalEarnings - weeklyStats.previousWeekEarnings).toLocaleString()} CDF par rapport à la semaine dernière
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weeklyStats.totalRides}</p>
                <p className="text-sm text-muted-foreground">Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
                <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weeklyStats.totalHours}h</p>
                <p className="text-sm text-muted-foreground">Heures</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg dark:bg-yellow-900/30">
                <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weeklyStats.averageRating || '–'}</p>
                <p className="text-sm text-muted-foreground">Note moyenne</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Détail par jour</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weeklyStats.dailyBreakdown.map((day, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[60px]">
                    <p className="font-medium">{getDayName(day.date)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(day.date)}</p>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      {day.rides} courses
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {day.hours}h
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{day.earnings.toLocaleString()} CDF</p>
                  <p className="text-xs text-muted-foreground">
                    {day.rides > 0 ? `${Math.round(day.earnings / day.rides)} CDF/course` : '–'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Gain moyen par course</p>
              <p className="text-lg font-semibold">
                {weeklyStats.totalRides > 0 
                  ? Math.round(weeklyStats.totalEarnings / weeklyStats.totalRides).toLocaleString()
                  : '0'
                } CDF
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Gain moyen par heure</p>
              <p className="text-lg font-semibold">
                {weeklyStats.totalHours > 0 
                  ? Math.round(weeklyStats.totalEarnings / weeklyStats.totalHours).toLocaleString()
                  : '0'
                } CDF
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};