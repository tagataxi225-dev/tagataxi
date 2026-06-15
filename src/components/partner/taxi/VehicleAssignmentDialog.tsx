import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { User, UserCheck } from 'lucide-react';

interface Driver {
  id: string;
  driver_id: string;
  driver_code: string;
  driver_name: string;
}

interface VehicleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  vehicleName: string;
  currentDriverId?: string | null;
  onAssign: (driverId: string | null) => Promise<void>;
}

export const VehicleAssignmentDialog = ({
  open,
  onOpenChange,
  vehicleId,
  vehicleName,
  currentDriverId,
  onAssign
}: VehicleAssignmentDialogProps) => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(currentDriverId || null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!open || !user) return;

    const fetchDrivers = async () => {
      setLoading(true);
      try {
        const { data: partenaire } = await supabase
          .from('partenaires')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('DEBUG partenaire:', partenaire);
        if (!partenaire) return;

        const { data: rows } = await supabase
          .from('partner_drivers')
          .select('id, driver_id, driver_code')
          .eq('partner_id', partenaire.id)
          .eq('status', 'active');

        console.log('DEBUG rows:', rows);
        if (!rows || rows.length === 0) {
          setDrivers([]);
          return;
        }

        const driverIds = rows.map(r => r.driver_id);

        const [profilesRes, chauffeursRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('user_id, display_name')
            .in('user_id', driverIds),
          supabase
            .from('chauffeurs')
            .select('user_id, display_name')
            .in('user_id', driverIds),
        ]);

        console.log('DEBUG profiles:', profilesRes.data, 'chauffeurs:', chauffeursRes.data);
        const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p]));
        const chauffeurMap = new Map((chauffeursRes.data || []).map((c: any) => [c.user_id, c]));

        setDrivers(rows.map(r => ({
          id: r.id,
          driver_id: r.driver_id,
          driver_code: r.driver_code,
          driver_name:
            profileMap.get(r.driver_id)?.display_name ||
            chauffeurMap.get(r.driver_id)?.display_name ||
            'Chauffeur',
        })));
      } catch (err) {
        console.error('Erreur chargement chauffeurs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, [open, user]);

  const handleAssign = async () => {
    setAssigning(true);
    try {
      await onAssign(selectedDriverId);
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur assignation:', error);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assigner un chauffeur</DialogTitle>
          <DialogDescription>
            Choisissez un chauffeur pour le véhicule {vehicleName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Chauffeur</Label>
            {loading ? (
              <p className="text-sm text-muted-foreground py-2">Chargement...</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                {/* Option "Aucun chauffeur" */}
                <button
                  type="button"
                  onClick={() => setSelectedDriverId(null)}
                  className={`flex items-center gap-3 w-full p-3 rounded-xl border-2 text-left transition-all ${
                    selectedDriverId === null
                      ? 'ring-2 ring-primary border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">Aucun chauffeur (retirer l'assignation)</span>
                </button>

                {/* Liste des chauffeurs */}
                {drivers.map((driver) => (
                  <button
                    key={driver.id}
                    type="button"
                    onClick={() => setSelectedDriverId(driver.driver_id)}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl border-2 text-left transition-all ${
                      selectedDriverId === driver.driver_id
                        ? 'ring-2 ring-primary border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{driver.driver_name}</p>
                      <p className="text-xs text-muted-foreground">Code: {driver.driver_code}</p>
                    </div>
                  </button>
                ))}

                {drivers.length === 0 && (
                  <p className="text-sm text-muted-foreground py-2">
                    Aucun chauffeur dans votre flotte. Ajoutez des chauffeurs d'abord.
                  </p>
                )}
              </div>
            )}
          </div>

          {currentDriverId && selectedDriverId !== currentDriverId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                Le chauffeur actuellement assigné sera remplacé par votre sélection.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={assigning}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assigning || loading}
              className="flex-1"
            >
              {assigning ? 'Assignation...' : 'Confirmer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
