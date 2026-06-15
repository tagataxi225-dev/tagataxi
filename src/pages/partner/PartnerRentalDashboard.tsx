import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar as CalendarIcon, Car, Check, X, Clock,
  TrendingUp, DollarSign, Users, AlertCircle,
  Phone, Mail, MapPin, ChevronRight, Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";

interface PartnerBooking {
  id: string;
  vehicle_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  security_deposit: number;
  status: string;
  driver_name: string;
  driver_phone: string;
  driver_email: string;
  created_at: string;
  vehicle: {
    name: string;
    brand: string;
    model: string;
    images: string[];
  };
}

interface CalendarBooking {
  id: string;
  vehicle_name: string;
  start_date: Date;
  end_date: Date;
  status: string;
  driver_name: string;
}

export const PartnerRentalDashboard = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<PartnerBooking[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<PartnerBooking | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    active: 0,
    completed: 0,
    revenue: 0,
  });

  useEffect(() => {
    fetchBookings();
    
    // Real-time subscription
    const channel = supabase
      .channel('partner_rental_bookings')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'rental_bookings' },
        (payload) => {
          console.log('Booking changed:', payload);
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBookings = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Fetch partner's vehicles first
      const { data: vehicles } = await supabase
        .from('rental_vehicles')
        .select('id')
        .eq('partner_id', user.user.id);

      if (!vehicles || vehicles.length === 0) {
        setIsLoading(false);
        return;
      }

      const vehicleIds = vehicles.map(v => v.id);

      // Fetch bookings for these vehicles
      const { data, error } = await supabase
        .from('rental_bookings')
        .select(`
          *,
          vehicle:rental_vehicles(name, brand, model, images)
        `)
        .in('vehicle_id', vehicleIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const bookingsData = data as any || [];
      setBookings(bookingsData);

      // Calculate stats
      const statsData = {
        total: bookingsData.length,
        pending: bookingsData.filter((b: any) => b.status === 'pending').length,
        confirmed: bookingsData.filter((b: any) => b.status === 'confirmed').length,
        active: bookingsData.filter((b: any) => b.status === 'in_progress').length,
        completed: bookingsData.filter((b: any) => b.status === 'completed').length,
        revenue: bookingsData
          .filter((b: any) => b.status === 'completed')
          .reduce((sum: number, b: any) => sum + (b.total_price || 0), 0),
      };
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les réservations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('rental_bookings')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Réservation acceptée",
        description: "Le client a été notifié",
      });

      fetchBookings();
      setShowDetailsDialog(false);
    } catch (error) {
      console.error('Error accepting booking:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accepter la réservation",
        variant: "destructive",
      });
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('rental_bookings')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Réservation refusée",
        description: "Le client a été notifié",
      });

      fetchBookings();
      setShowDetailsDialog(false);
    } catch (error) {
      console.error('Error rejecting booking:', error);
      toast({
        title: "Erreur",
        description: "Impossible de refuser la réservation",
        variant: "destructive",
      });
    }
  };

  const getBookingsForCalendar = (): CalendarBooking[] => {
    return bookings
      .filter(b => b.status !== 'cancelled')
      .map(b => ({
        id: b.id,
        vehicle_name: b.vehicle?.name || 'Véhicule',
        start_date: new Date(b.start_date),
        end_date: new Date(b.end_date),
        status: b.status,
        driver_name: b.driver_name,
      }));
  };

  const getBookingsForDate = (date: Date): CalendarBooking[] => {
    return getBookingsForCalendar().filter(booking => {
      return date >= booking.start_date && date <= booking.end_date;
    });
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
          <div key={day} className="text-center font-semibold text-sm p-2">
            {day}
          </div>
        ))}

        {/* Days */}
        {days.map(day => {
          const dayBookings = getBookingsForDate(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`
                min-h-24 p-2 border rounded-lg relative
                ${isToday ? 'bg-primary/10 border-primary' : 'bg-card border-border'}
                ${dayBookings.length > 0 ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
              `}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                {format(day, 'd')}
              </div>
              
              {dayBookings.length > 0 && (
                <div className="space-y-1">
                  {dayBookings.slice(0, 2).map(booking => (
                    <div
                      key={booking.id}
                      className={`
                        text-xs p-1 rounded truncate
                        ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                        ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${booking.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : ''}
                      `}
                    >
                      {booking.vehicle_name}
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayBookings.length - 2} autre{dayBookings.length - 2 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderBookingsList = (filterStatus?: string) => {
    const filtered = filterStatus 
      ? bookings.filter(b => b.status === filterStatus)
      : bookings;

    if (filtered.length === 0) {
      return (
        <Card className="glassmorphism">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">Aucune réservation</h3>
            <p className="text-muted-foreground">
              Aucune réservation ne correspond à ce filtre
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {filtered.map(booking => (
          <Card 
            key={booking.id} 
            className="glassmorphism hover:shadow-lg transition-all cursor-pointer"
            onClick={() => {
              setSelectedBooking(booking);
              setShowDetailsDialog(true);
            }}
          >
            <CardContent className="p-4">
              <div className="flex gap-4">
                {booking.vehicle?.images?.[0] && (
                  <img 
                    src={booking.vehicle.images[0]} 
                    alt={booking.vehicle.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{booking.vehicle?.name}</h4>
                      <p className="text-sm text-muted-foreground">{booking.driver_name}</p>
                    </div>
                    <Badge variant={
                      booking.status === 'confirmed' ? 'default' :
                      booking.status === 'pending' ? 'outline' :
                      booking.status === 'in_progress' ? 'secondary' :
                      'outline'
                    }>
                      {booking.status === 'pending' && 'En attente'}
                      {booking.status === 'confirmed' && 'Confirmé'}
                      {booking.status === 'in_progress' && 'En cours'}
                      {booking.status === 'completed' && 'Terminé'}
                      {booking.status === 'cancelled' && 'Annulé'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{format(new Date(booking.start_date), 'dd MMM', { locale: fr })}</span>
                    </div>
                    <span>→</span>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{format(new Date(booking.end_date), 'dd MMM', { locale: fr })}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-muted-foreground">
                      Créé le {format(new Date(booking.created_at), 'dd/MM/yyyy', { locale: fr })}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {booking.total_price.toLocaleString()} FC
                    </span>
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="glassmorphism border-b border-border/20 sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Tableau de Bord Location</h1>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glassmorphism">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En attente</p>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="glassmorphism">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Confirmées</p>
                    <p className="text-2xl font-bold">{stats.confirmed}</p>
                  </div>
                  <Check className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="glassmorphism">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En cours</p>
                    <p className="text-2xl font-bold">{stats.active}</p>
                  </div>
                  <Car className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="glassmorphism">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Revenus</p>
                    <p className="text-xl font-bold">{stats.revenue.toLocaleString()} FC</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="calendar">Calendrier</TabsTrigger>
            <TabsTrigger value="pending">En attente ({stats.pending})</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmées ({stats.confirmed})</TabsTrigger>
            <TabsTrigger value="all">Toutes</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-6">
            <Card className="glassmorphism">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {format(selectedMonth, 'MMMM yyyy', { locale: fr })}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)))}
                    >
                      ←
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedMonth(new Date())}
                    >
                      Aujourd'hui
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)))}
                    >
                      →
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderCalendar()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            {renderBookingsList('pending')}
          </TabsContent>

          <TabsContent value="confirmed" className="mt-6">
            {renderBookingsList('confirmed')}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            {renderBookingsList()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle>Détails de la réservation</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Vehicle */}
                <div>
                  <h4 className="font-semibold mb-2">Véhicule</h4>
                  <div className="flex gap-4">
                    {selectedBooking.vehicle?.images?.[0] && (
                      <img 
                        src={selectedBooking.vehicle.images[0]} 
                        alt={selectedBooking.vehicle.name}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <p className="font-medium">{selectedBooking.vehicle?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedBooking.vehicle?.brand} {selectedBooking.vehicle?.model}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Client Info */}
                <div>
                  <h4 className="font-semibold mb-2">Informations client</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedBooking.driver_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedBooking.driver_phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedBooking.driver_email}</span>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <h4 className="font-semibold mb-2">Période</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Début</p>
                      <p>{format(new Date(selectedBooking.start_date), 'dd MMMM yyyy', { locale: fr })}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fin</p>
                      <p>{format(new Date(selectedBooking.end_date), 'dd MMMM yyyy', { locale: fr })}</p>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Prix de location</span>
                      <span>{selectedBooking.total_price.toLocaleString()} FC</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Caution</span>
                      <span>{selectedBooking.security_deposit.toLocaleString()} FC</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total</span>
                      <span className="text-primary">
                        {(selectedBooking.total_price + selectedBooking.security_deposit).toLocaleString()} FC
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                {selectedBooking.status === 'pending' && (
                  <>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleRejectBooking(selectedBooking.id)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Refuser
                    </Button>
                    <Button 
                      onClick={() => handleAcceptBooking(selectedBooking.id)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Accepter
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerRentalDashboard;
