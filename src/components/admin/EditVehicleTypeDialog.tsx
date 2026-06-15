import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VehicleTypeData } from '@/hooks/admin/useVehicleTypeManagement';

interface EditVehicleTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleType: VehicleTypeData | null;
  onSave: (updates: Partial<VehicleTypeData> & { id: string }) => void;
}

export const EditVehicleTypeDialog = ({
  open,
  onOpenChange,
  vehicleType,
  onSave,
}: EditVehicleTypeDialogProps) => {
  const [formData, setFormData] = useState({
    display_name: vehicleType?.display_name || '',
    description: vehicleType?.description || '',
    base_price: vehicleType?.base_price || 0,
    price_per_km: vehicleType?.price_per_km || 0,
    minimum_fare: vehicleType?.minimum_fare || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleType) return;

    // Validations
    if (formData.base_price < 500) {
      alert('Le prix de base doit être au minimum 500 CDF');
      return;
    }
    if (formData.price_per_km < 100) {
      alert('Le prix par km doit être au minimum 100 CDF');
      return;
    }
    if (formData.minimum_fare < formData.base_price) {
      alert('Le prix minimum doit être supérieur ou égal au prix de base');
      return;
    }

    onSave({
      id: vehicleType.id,
      ...formData,
    });

    onOpenChange(false);
  };

  if (!vehicleType) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier {vehicleType.display_name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">Nom d'affichage</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="Ex: Confort, Éco..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du service"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_price">Prix de base (CDF)</Label>
              <Input
                id="base_price"
                type="number"
                min="500"
                step="100"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_per_km">Prix par km (CDF)</Label>
              <Input
                id="price_per_km"
                type="number"
                min="100"
                step="50"
                value={formData.price_per_km}
                onChange={(e) => setFormData({ ...formData, price_per_km: parseFloat(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimum_fare">Minimum (CDF)</Label>
              <Input
                id="minimum_fare"
                type="number"
                min="500"
                step="100"
                value={formData.minimum_fare}
                onChange={(e) => setFormData({ ...formData, minimum_fare: parseFloat(e.target.value) })}
                required
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
