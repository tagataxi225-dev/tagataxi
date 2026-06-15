import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MapPin, Calendar, DollarSign, Users, Fuel, Settings, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface VehicleModerationModalProps {
  vehicle: any;
  open: boolean;
  onClose: () => void;
}

export const VehicleModerationModal = ({ vehicle, open, onClose }: VehicleModerationModalProps) => {
  if (!vehicle) return null;

  const images = Array.isArray(vehicle.images) ? vehicle.images : [];
  const features = Array.isArray(vehicle.features) ? vehicle.features : [];
  const equipment = Array.isArray(vehicle.equipment) ? vehicle.equipment : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🚗 {vehicle.name}
            <Badge variant={vehicle.moderation_status === 'pending' ? 'secondary' : 'default'}>
              {vehicle.moderation_status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {vehicle.brand} {vehicle.model} - {vehicle.year}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 pr-4">
            {/* Images */}
            {images.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">📸 Photos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {images.map((img: string, idx: number) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${vehicle.name} ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Informations principales */}
            <div>
              <h3 className="font-semibold mb-3">📋 Informations</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tarif journalier</p>
                    <p className="font-semibold">{vehicle.daily_rate} CDF</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tarif hebdomadaire</p>
                    <p className="font-semibold">{vehicle.weekly_rate} CDF</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Caution</p>
                    <p className="font-semibold">{vehicle.security_deposit} CDF</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Places</p>
                    <p className="font-semibold">{vehicle.seats} personnes</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Carburant</p>
                    <p className="font-semibold">{vehicle.fuel_type || 'Non spécifié'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Transmission</p>
                    <p className="font-semibold">{vehicle.transmission || 'Non spécifié'}</p>
                  </div>
                </div>

                {vehicle.city && (
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Localisation</p>
                      <p className="font-semibold">{vehicle.city}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 col-span-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date de soumission</p>
                    <p className="font-semibold">
                      {format(new Date(vehicle.created_at), 'PPP à HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Caractéristiques */}
            {features.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">✨ Caractéristiques</h3>
                  <div className="flex flex-wrap gap-2">
                    {features.map((feature: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{feature}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Équipements */}
            {equipment.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">🛠️ Équipements</h3>
                  <div className="flex flex-wrap gap-2">
                    {equipment.map((item: string, idx: number) => (
                      <Badge key={idx} variant="outline">{item}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Informations partenaire */}
            {vehicle.partner_name && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">👤 Partenaire</h3>
                  <p className="text-sm">{vehicle.partner_name}</p>
                  {vehicle.license_plate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Plaque: {vehicle.license_plate}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};