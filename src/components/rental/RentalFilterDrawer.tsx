import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Drawer,
  DrawerContent,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';

export interface RentalFilters {
  priceRange: [number, number];
  transmission: string[];
  fuelType: string[];
  minSeats: number;
  driverAvailable: boolean | null;
  minYear: number;
}

export const defaultRentalFilters: RentalFilters = {
  priceRange: [0, 500000],
  transmission: [],
  fuelType: [],
  minSeats: 0,
  driverAvailable: null,
  minYear: 2015,
};

interface RentalFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: RentalFilters;
  onUpdateFilters: (filters: RentalFilters) => void;
  onReset: () => void;
  activeFiltersCount: number;
}

const TRANSMISSIONS = [
  { value: 'automatique', label: 'Automatique' },
  { value: 'manuelle', label: 'Manuelle' },
];

const FUEL_TYPES = [
  { value: 'essence', label: 'Essence' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electrique', label: 'Électrique' },
  { value: 'hybride', label: 'Hybride' },
];

const SEAT_OPTIONS = [
  { value: 0, label: 'Tous' },
  { value: 2, label: '2+' },
  { value: 4, label: '4+' },
  { value: 5, label: '5+' },
  { value: 7, label: '7+' },
];

const YEARS = Array.from({ length: 11 }, (_, i) => 2015 + i);

export const RentalFilterDrawer: React.FC<RentalFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onUpdateFilters,
  onReset,
  activeFiltersCount,
}) => {
  const handleTransmissionChange = (value: string, checked: boolean) => {
    const newTransmissions = checked
      ? [...filters.transmission, value]
      : filters.transmission.filter((t) => t !== value);
    onUpdateFilters({ ...filters, transmission: newTransmissions });
  };

  const handleFuelChange = (value: string, checked: boolean) => {
    const newFuels = checked
      ? [...filters.fuelType, value]
      : filters.fuelType.filter((f) => f !== value);
    onUpdateFilters({ ...filters, fuelType: newFuels });
  };

  const handleDriverChange = (value: string) => {
    const driverValue = value === 'all' ? null : value === 'yes';
    onUpdateFilters({ ...filters, driverAvailable: driverValue });
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(value) + ' CDF';
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHandle />
        
        <DrawerHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-xl font-bold">Filtres</DrawerTitle>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  className="text-muted-foreground hover:text-foreground gap-1"
                >
                  <RotateCcw className="h-4 w-4" />
                  Réinitialiser
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 py-4 space-y-6">
          {/* Prix journalier */}
          <div className="space-y-4">
            <Label className="text-base font-semibold flex items-center gap-2">
              💰 Prix journalier
            </Label>
            <div className="px-2">
              <Slider
                value={filters.priceRange}
                onValueChange={(value) =>
                  onUpdateFilters({ ...filters, priceRange: value as [number, number] })
                }
                min={0}
                max={500000}
                step={10000}
                className="w-full pointer-events-auto"
              />
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>{formatPrice(filters.priceRange[0])}</span>
                <span>{formatPrice(filters.priceRange[1])}</span>
              </div>
            </div>
          </div>

          {/* Transmission */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              ⚙️ Transmission
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {TRANSMISSIONS.map((trans) => (
                <div key={trans.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`trans-${trans.value}`}
                    checked={filters.transmission.includes(trans.value)}
                    onCheckedChange={(checked) =>
                      handleTransmissionChange(trans.value, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`trans-${trans.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {trans.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Carburant */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              ⛽ Type de carburant
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {FUEL_TYPES.map((fuel) => (
                <div key={fuel.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`fuel-${fuel.value}`}
                    checked={filters.fuelType.includes(fuel.value)}
                    onCheckedChange={(checked) =>
                      handleFuelChange(fuel.value, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`fuel-${fuel.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {fuel.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Places */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              🪑 Places minimum
            </Label>
            <div className="flex flex-wrap gap-2">
              {SEAT_OPTIONS.map((seat) => (
                <Button
                  key={seat.value}
                  variant={filters.minSeats === seat.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUpdateFilters({ ...filters, minSeats: seat.value })}
                  className="min-w-[50px]"
                >
                  {seat.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Chauffeur */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              👨‍✈️ Chauffeur disponible
            </Label>
            <RadioGroup
              value={
                filters.driverAvailable === null
                  ? 'all'
                  : filters.driverAvailable
                  ? 'yes'
                  : 'no'
              }
              onValueChange={handleDriverChange}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="driver-all" />
                <label htmlFor="driver-all" className="text-sm cursor-pointer">
                  Tous
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="driver-yes" />
                <label htmlFor="driver-yes" className="text-sm cursor-pointer">
                  Avec chauffeur disponible
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="driver-no" />
                <label htmlFor="driver-no" className="text-sm cursor-pointer">
                  Sans chauffeur
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Année minimum */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              📅 Année minimum
            </Label>
            <Select
              value={filters.minYear.toString()}
              onValueChange={(value) =>
                onUpdateFilters({ ...filters, minYear: parseInt(value) })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200] pointer-events-auto">
                {YEARS.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DrawerFooter className="border-t pt-4">
          <Button onClick={onClose} className="w-full">
            Voir {activeFiltersCount > 0 ? `les résultats` : 'tous les véhicules'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
