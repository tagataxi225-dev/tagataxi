import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RentalBooking, RentalVehicle } from "@/hooks/usePartnerRentals";
import { Calendar, MapPin, Car, Clock, User, Check, X, Play, Flag, Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  bookings: RentalBooking[];
  vehicles: RentalVehicle[];
  onUpdateStatus: (id: string, status: RentalBooking["status"]) => void;
}

const statusConfig: Record<RentalBooking["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  pending: { label: "Nouvelle demande", variant: "secondary", color: "bg-amber-500/20 text-amber-600 border-amber-500/30" },
  approved_by_partner: { label: "Validée - En attente paiement", variant: "secondary", color: "bg-blue-500/20 text-blue-600 border-blue-500/30" },
  confirmed: { label: "Confirmée & Payée", variant: "default", color: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" },
  in_progress: { label: "En cours", variant: "default", color: "bg-purple-500/20 text-purple-600 border-purple-500/30" },
  completed: { label: "Terminée", variant: "outline", color: "bg-gray-500/20 text-gray-600 border-gray-500/30" },
  cancelled: { label: "Annulée", variant: "destructive", color: "bg-red-500/20 text-red-600 border-red-500/30" },
  rejected: { label: "Rejetée", variant: "destructive", color: "bg-red-500/20 text-red-600 border-red-500/30" },
  no_show: { label: "Absent", variant: "destructive", color: "bg-orange-500/20 text-orange-600 border-orange-500/30" },
};

const getPaymentBadge = (paymentStatus?: string) => {
  if (paymentStatus === 'paid') {
    return (
      <Badge className="bg-green-500/20 text-green-600 border-green-500/30 border gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Payé
      </Badge>
    );
  }
  if (paymentStatus === 'pending') {
    return (
      <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 border gap-1">
        <Wallet className="h-3 w-3" />
        Non payé
      </Badge>
    );
  }
  return null;
};

export default function PartnerBookingsList({ bookings, vehicles, onUpdateStatus }: Props) {
  const getVehicle = (vehicleId: string) => vehicles.find(v => v.id === vehicleId);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filtrer les réservations: exclure les terminées/annulées avec dates passées
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const filteredBookings = bookings.filter(booking => {
    const endDate = new Date(booking.end_date);
    const isFinished = ['completed', 'cancelled', 'rejected', 'no_show'].includes(booking.status);
    
    // Garder les réservations actives ou futures
    if (!isFinished) return true;
    
    // Pour les terminées, ne garder que celles des 7 derniers jours
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return endDate >= sevenDaysAgo;
  });

  // Trier: pending et approved_by_partner en premier, puis confirmed, puis in_progress
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const priority: Record<string, number> = {
      pending: 0,
      approved_by_partner: 1,
      confirmed: 2,
      in_progress: 3,
      completed: 4,
      cancelled: 5,
      rejected: 5,
      no_show: 5
    };
    return (priority[a.status] || 99) - (priority[b.status] || 99);
  });

  // Calculer l'urgence (réservation qui commence dans moins de 24h)
  const isUrgent = (startDate: string) => {
    const start = new Date(startDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return start <= tomorrow && start >= today;
  };

  const getActionButtons = (booking: RentalBooking) => {
    switch (booking.status) {
      case "pending":
        // Nouvelle demande → Le partenaire confirme la disponibilité
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Confirmez la disponibilité du véhicule</span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onUpdateStatus(booking.id, "approved_by_partner")}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
              >
                <Check className="h-3.5 w-3.5" />
                Confirmer disponibilité
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateStatus(booking.id, "rejected")}
                className="border-red-500/50 text-red-600 hover:bg-red-50 gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Rejeter
              </Button>
            </div>
          </div>
        );
      case "approved_by_partner":
        // Validé par partenaire, en attente de paiement client
        return (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-700 dark:text-blue-400">
              En attente du paiement client...
            </span>
          </div>
        );
      case "confirmed":
        // Payé → Le partenaire peut démarrer
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onUpdateStatus(booking.id, "in_progress")}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-1"
            >
              <Play className="h-3.5 w-3.5" />
              Démarrer location
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus(booking.id, "no_show")}
              className="border-orange-500/50 text-orange-600 hover:bg-orange-50 gap-1"
            >
              <User className="h-3.5 w-3.5" />
              Client absent
            </Button>
          </div>
        );
      case "in_progress":
        return (
          <Button
            size="sm"
            onClick={() => onUpdateStatus(booking.id, "completed")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1"
          >
            <Flag className="h-3.5 w-3.5" />
            Terminer location
          </Button>
        );
      default:
        return null;
    }
  };

  if (sortedBookings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Calendar className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Aucune réservation active</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Les nouvelles réservations de vos véhicules apparaîtront ici
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {sortedBookings.map((booking, index) => {
          const vehicle = getVehicle(booking.vehicle_id);
          const status = statusConfig[booking.status];
          const urgent = isUrgent(booking.start_date);

          return (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={urgent ? "ring-2 ring-amber-500/50 rounded-lg" : ""}
            >
              <Card className="border border-border/20 shadow-lg bg-card/95 backdrop-blur-sm overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 border-b border-border/10">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex flex-wrap gap-2">
                      {urgent && (
                        <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 border gap-1 animate-pulse">
                          ⚡ Urgent
                        </Badge>
                      )}
                      <Badge className={`${status.color} border font-medium`}>
                        {status.label}
                      </Badge>
                      {getPaymentBadge(booking.payment_status)}
                    </div>
                    <span className="text-lg font-bold text-primary">
                      {Number(booking.total_amount).toLocaleString()} CDF
                    </span>
                  </div>
                </div>

                <CardContent className="p-4 space-y-4">
                  {/* Vehicle info */}
                  {vehicle && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                        {vehicle.images?.[0] ? (
                          <img
                            src={vehicle.images[0]}
                            alt={vehicle.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Car className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">
                          {vehicle.brand} {vehicle.model}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.year} • {vehicle.seats} places
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatDate(booking.start_date)}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{formatDate(booking.end_date)}</span>
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Retrait</p>
                        <p className="font-medium text-foreground truncate">{booking.pickup_location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Retour</p>
                        <p className="font-medium text-foreground truncate">{booking.return_location}</p>
                      </div>
                    </div>
                  </div>

                  {/* Deposit */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/10 text-sm">
                    <span className="text-muted-foreground">Caution</span>
                    <span className="font-semibold">{Number(booking.security_deposit).toLocaleString()} CDF</span>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2">
                    {getActionButtons(booking)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
