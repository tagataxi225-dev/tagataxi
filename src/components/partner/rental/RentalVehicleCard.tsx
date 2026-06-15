import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Eye, EyeOff, Clock, CheckCircle, XCircle } from "lucide-react";
import { RentalVehicle, usePartnerRentals } from "@/hooks/usePartnerRentals";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency } from "@/utils/formatCurrency";

interface Props {
  vehicle: RentalVehicle;
  onEdit: (v: RentalVehicle) => void;
}

export default function RentalVehicleCard({ vehicle, onEdit }: Props) {
  const { updateVehicle, deleteVehicle } = usePartnerRentals();
  const isMobile = useIsMobile();

  const statusConfig = {
    approved: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: "✓" },
    rejected: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: "✗" },
    pending: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", icon: "⏳" }
  };

  const status = vehicle.moderation_status === "approved" ? "approved" : 
                 vehicle.moderation_status === "rejected" ? "rejected" : "pending";

  return (
    <Card className="group rounded-3xl border border-grey-100 bg-background shadow-sm hover:shadow-elegant hover:border-primary/20 transition-all duration-300">
      <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
        {/* Header with title and status */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-card-foreground truncate ${isMobile ? 'text-base' : 'text-lg'} mb-2`}>
              {vehicle.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {vehicle.moderation_status === 'pending' && (
                <Badge className="bg-yellow-500 text-white border-0 rounded-full px-3 py-1 text-xs font-medium">
                  <Clock className="w-3 h-3 mr-1" /> En attente de validation
                </Badge>
              )}
              {vehicle.moderation_status === 'approved' && (
                <Badge className="bg-green-500 text-white border-0 rounded-full px-3 py-1 text-xs font-medium">
                  <CheckCircle className="w-3 h-3 mr-1" /> Approuvé et visible
                </Badge>
              )}
              {vehicle.moderation_status === 'rejected' && (
                <Badge className="bg-red-500 text-white border-0 rounded-full px-3 py-1 text-xs font-medium">
                  <XCircle className="w-3 h-3 mr-1" /> Rejeté
                </Badge>
              )}
              {!vehicle.is_active && (
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs bg-grey-100 text-grey-600 border border-grey-200">
                  Inactif
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Vehicle details */}
        <div className="space-y-3 mb-4">
          <div className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
            <span className="font-medium">{vehicle.brand} {vehicle.model}</span> • {vehicle.year} • {vehicle.seats} places
          </div>
          <div className={`text-primary font-semibold ${isMobile ? 'text-sm' : 'text-base'}`}>
            {formatCurrency(vehicle.daily_rate, 'CDF')}/jour
          </div>
          <div className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
            Caution: {formatCurrency(vehicle.security_deposit, 'CDF')}
          </div>
          {vehicle.moderation_status === "rejected" && vehicle.rejection_reason && (
            <div className={`text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <strong>Motif:</strong> {vehicle.rejection_reason}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-3">
          {/* Availability toggle */}
          <div className="flex items-center justify-between p-3 bg-grey-50 rounded-2xl border border-grey-100">
            <div className="flex items-center gap-2">
              {vehicle.is_available ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-grey-400" />}
              <span className={`font-medium text-card-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
                Disponible
              </span>
            </div>
            <Switch
              checked={vehicle.is_available}
              onCheckedChange={(val) => updateVehicle.mutate({ id: vehicle.id, updates: { is_available: val } })}
              className="data-[state=checked]:bg-green-500"
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between p-3 bg-grey-50 rounded-2xl border border-grey-100">
            <span className={`font-medium text-card-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
              Véhicule actif
            </span>
            <Switch
              checked={vehicle.is_active}
              onCheckedChange={(val) => updateVehicle.mutate({ id: vehicle.id, updates: { is_active: val } })}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {/* Action buttons */}
          <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'flex-row'}`}>
            <Button 
              variant="outline" 
              size={isMobile ? "default" : "sm"}
              onClick={() => onEdit(vehicle)}
              className={`rounded-2xl border-grey-200 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 ${isMobile ? 'flex-1' : ''}`}
            >
              <Pencil className="w-4 h-4 mr-2" /> Modifier
            </Button>
            <Button
              variant="outline"
              size={isMobile ? "default" : "sm"}
              onClick={() => {
                if (confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
                  deleteVehicle.mutate(vehicle.id);
                }
              }}
              className={`rounded-2xl border-red-200 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 ${isMobile ? 'flex-1' : ''}`}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Supprimer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
