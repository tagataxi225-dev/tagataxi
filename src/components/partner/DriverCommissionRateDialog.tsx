import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Percent, AlertCircle, TrendingUp } from 'lucide-react';
import { useUpdateDriverCommissionRate } from '@/hooks/useUpdateDriverCommissionRate';

interface DriverCommissionRateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: {
    id: string;
    driver_id: string;
    driver_name: string;
    commission_rate?: number;
  } | null;
  onSuccess?: () => void;
}

export const DriverCommissionRateDialog = ({
  open,
  onOpenChange,
  driver,
  onSuccess
}: DriverCommissionRateDialogProps) => {
  const { updateCommissionRate, updating, maxRate } = useUpdateDriverCommissionRate();
  const [rate, setRate] = useState(2.5);

  useEffect(() => {
    if (driver) {
      setRate(driver.commission_rate ?? 2.5);
    }
  }, [driver]);

  const handleSave = async () => {
    if (!driver) return;

    const success = await updateCommissionRate(driver.id, driver.driver_id, rate);
    if (success) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const estimatedEarnings = (rideAmount: number) => {
    return Math.round((rideAmount * rate) / 100);
  };

  if (!driver) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            Commission pour {driver.driver_name}
          </DialogTitle>
          <DialogDescription>
            Définissez le pourcentage que vous recevrez sur chaque course de ce chauffeur.
            Maximum autorisé : {maxRate}%
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Taux de commission</Label>
              <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
                {rate}%
              </Badge>
            </div>
            
            <Slider
              value={[rate]}
              onValueChange={(values) => setRate(values[0])}
              min={0}
              max={maxRate}
              step={0.5}
              className="py-4"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>{maxRate}%</span>
            </div>
          </div>

          {/* Simulation */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Simulation de gains
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Course 5,000 CDF</p>
                <p className="font-semibold text-green-600">+{estimatedEarnings(5000)} CDF</p>
              </div>
              <div>
                <p className="text-muted-foreground">Course 10,000 CDF</p>
                <p className="font-semibold text-green-600">+{estimatedEarnings(10000)} CDF</p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-muted-foreground">
              Cette commission sera automatiquement prélevée sur chaque course terminée 
              et créditée dans votre wallet partenaire.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={updating}>
            {updating ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
