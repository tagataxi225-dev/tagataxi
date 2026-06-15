import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Car, Loader2 } from 'lucide-react';
import { usePartnerTaxiVehicles, TaxiVehicle } from '@/hooks/usePartnerTaxiVehicles';
import TaxiVehicleCard from './TaxiVehicleCard';
import TaxiVehicleForm from './TaxiVehicleForm';

export const PartnerTaxiVehicleList = () => {
  const { vehicles, isLoading } = usePartnerTaxiVehicles();
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<TaxiVehicle | null>(null);

  const handleEdit = (vehicle: TaxiVehicle) => {
    setEditingVehicle(vehicle);
    setShowForm(true);
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditingVehicle(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Chargement des véhicules...</span>
      </div>
    );
  }

  if (showForm) {
    return (
      <TaxiVehicleForm
        initial={editingVehicle || undefined}
        onSaved={handleSaved}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Véhicules Taxi</h3>
          <p className="text-sm text-muted-foreground">{vehicles.length} véhicule(s) enregistré(s)</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="rounded-xl gap-2">
          <Plus className="w-4 h-4" />
          Ajouter
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Car className="w-12 h-12 mb-3 opacity-40" />
          <p className="font-medium">Aucun véhicule enregistré</p>
          <p className="text-sm">Ajoutez votre premier véhicule taxi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map((vehicle) => (
            <TaxiVehicleCard key={vehicle.id} vehicle={vehicle} onEdit={handleEdit} />
          ))}
        </div>
      )}
    </div>
  );
};
