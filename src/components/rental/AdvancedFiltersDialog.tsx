import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { SlidersHorizontal, X } from 'lucide-react';

interface AdvancedFilters {
  priceRange: [number, number];
  comfortLevels: string[];
  equipments: string[];
  seats: number | null;
  transmission: string | null;
  fuelType: string | null;
  driverAvailable: boolean | null;
}

interface AdvancedFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  onReset: () => void;
}

const COMFORT_LEVELS = ['Économique', 'Standard', 'Confort', 'Premium', 'Luxe'];
const EQUIPMENTS = [
  'Climatisation',
  'GPS',
  'Bluetooth',
  'Sièges cuir',
  'Caméra recul',
  'Radar recul',
  'Régulateur vitesse',
  'Toit ouvrant'
];
const TRANSMISSIONS = ['Manuelle', 'Automatique'];
const FUEL_TYPES = ['Essence', 'Diesel', 'Hybride', 'Électrique'];

export const AdvancedFiltersDialog = ({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onReset,
}: AdvancedFiltersDialogProps) => {
  const handleComfortToggle = (level: string) => {
    const newLevels = filters.comfortLevels.includes(level)
      ? filters.comfortLevels.filter(l => l !== level)
      : [...filters.comfortLevels, level];
    onFiltersChange({ ...filters, comfortLevels: newLevels });
  };

  const handleEquipmentToggle = (equipment: string) => {
    const newEquipments = filters.equipments.includes(equipment)
      ? filters.equipments.filter(e => e !== equipment)
      : [...filters.equipments, equipment];
    onFiltersChange({ ...filters, equipments: newEquipments });
  };

  const activeFiltersCount = 
    (filters.comfortLevels.length > 0 ? 1 : 0) +
    (filters.equipments.length > 0 ? 1 : 0) +
    (filters.seats !== null ? 1 : 0) +
    (filters.transmission !== null ? 1 : 0) +
    (filters.fuelType !== null ? 1 : 0) +
    (filters.driverAvailable !== null ? 1 : 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              <span>Filtres avancés</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount} actifs</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onReset}>
              <X className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Prix */}
          <div className="space-y-3">
            <Label>Fourchette de prix (CDF/jour)</Label>
            <div className="px-2">
              <Slider
                min={10000}
                max={200000}
                step={5000}
                value={filters.priceRange}
                onValueChange={(value) => 
                  onFiltersChange({ ...filters, priceRange: value as [number, number] })
                }
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>{filters.priceRange[0].toLocaleString()} CDF</span>
                <span>{filters.priceRange[1].toLocaleString()} CDF</span>
              </div>
            </div>
          </div>

          {/* Niveau de confort */}
          <div className="space-y-3">
            <Label>Niveau de confort</Label>
            <div className="flex flex-wrap gap-2">
              {COMFORT_LEVELS.map((level) => (
                <Badge
                  key={level}
                  variant={filters.comfortLevels.includes(level) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleComfortToggle(level)}
                >
                  {level}
                </Badge>
              ))}
            </div>
          </div>

          {/* Équipements */}
          <div className="space-y-3">
            <Label>Équipements</Label>
            <div className="grid grid-cols-2 gap-3">
              {EQUIPMENTS.map((equipment) => (
                <div key={equipment} className="flex items-center space-x-2">
                  <Checkbox
                    id={equipment}
                    checked={filters.equipments.includes(equipment)}
                    onCheckedChange={() => handleEquipmentToggle(equipment)}
                  />
                  <label
                    htmlFor={equipment}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {equipment}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Nombre de places */}
          <div className="space-y-3">
            <Label>Nombre de places minimum</Label>
            <div className="flex gap-2">
              {[2, 4, 5, 7, 9].map((seats) => (
                <Badge
                  key={seats}
                  variant={filters.seats === seats ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => 
                    onFiltersChange({ 
                      ...filters, 
                      seats: filters.seats === seats ? null : seats 
                    })
                  }
                >
                  {seats}+
                </Badge>
              ))}
            </div>
          </div>

          {/* Transmission */}
          <div className="space-y-3">
            <Label>Transmission</Label>
            <div className="flex gap-2">
              {TRANSMISSIONS.map((trans) => (
                <Badge
                  key={trans}
                  variant={filters.transmission === trans ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => 
                    onFiltersChange({ 
                      ...filters, 
                      transmission: filters.transmission === trans ? null : trans 
                    })
                  }
                >
                  {trans}
                </Badge>
              ))}
            </div>
          </div>

          {/* Type de carburant */}
          <div className="space-y-3">
            <Label>Type de carburant</Label>
            <div className="flex gap-2">
              {FUEL_TYPES.map((fuel) => (
                <Badge
                  key={fuel}
                  variant={filters.fuelType === fuel ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => 
                    onFiltersChange({ 
                      ...filters, 
                      fuelType: filters.fuelType === fuel ? null : fuel 
                    })
                  }
                >
                  {fuel}
                </Badge>
              ))}
            </div>
          </div>

          {/* Chauffeur disponible */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="driver"
              checked={filters.driverAvailable === true}
              onCheckedChange={(checked) =>
                onFiltersChange({ 
                  ...filters, 
                  driverAvailable: checked ? true : null 
                })
              }
            />
            <label
              htmlFor="driver"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Avec chauffeur disponible
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onReset}>
            Réinitialiser
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Appliquer les filtres
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
