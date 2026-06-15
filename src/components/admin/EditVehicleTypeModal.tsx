import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { VehicleTypeConfig } from '@/hooks/admin/useVehicleTypeConfig';

interface EditVehicleTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleType: VehicleTypeConfig | null;
  onSave: (updates: {
    displayName: string;
    description: string;
    isActive: boolean;
    basePrice: number;
    pricePerKm: number;
    minimumFare: number;
  }) => void;
}

export const EditVehicleTypeModal = ({
  open,
  onOpenChange,
  vehicleType,
  onSave
}: EditVehicleTypeModalProps) => {
  const [formData, setFormData] = useState({
    displayName: '',
    description: '',
    isActive: true,
    basePrice: 0,
    pricePerKm: 0,
    minimumFare: 0
  });

  useEffect(() => {
    if (vehicleType) {
      setFormData({
        displayName: vehicleType.display_name,
        description: vehicleType.description,
        isActive: vehicleType.is_active,
        basePrice: vehicleType.base_price,
        pricePerKm: vehicleType.price_per_km,
        minimumFare: vehicleType.minimum_fare
      });
    }
  }, [vehicleType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!vehicleType) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Modifier: {vehicleType.display_name}</DialogTitle>
            <DialogDescription>
              Modifiez le nom, la description et les tarifs de ce type de véhicule
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nom affiché */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Nom affiché</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Ex: Moto-taxi"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du service..."
                rows={3}
                required
              />
            </div>

            {/* Tarifs */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basePrice">Prix de base ({vehicleType.currency})</Label>
                <Input
                  id="basePrice"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerKm">Par km ({vehicleType.currency})</Label>
                <Input
                  id="pricePerKm"
                  type="number"
                  min="0"
                  step="50"
                  value={formData.pricePerKm}
                  onChange={(e) => setFormData({ ...formData, pricePerKm: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumFare">Minimum ({vehicleType.currency})</Label>
                <Input
                  id="minimumFare"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.minimumFare}
                  onChange={(e) => setFormData({ ...formData, minimumFare: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            {/* Actif/Inactif */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Service actif</Label>
                <p className="text-sm text-muted-foreground">
                  Activer ou désactiver ce type de véhicule
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
