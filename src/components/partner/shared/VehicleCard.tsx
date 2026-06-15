import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge, StatusType } from './StatusBadge';
import { Car, Calendar, User, Gauge, MoreVertical, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VehicleCardProps {
  vehicle: {
    id: string;
    type: string;
    brand: string;
    model: string;
    plate: string;
    year: number;
    status: StatusType;
    driverName?: string;
    lastService?: string;
    mileage?: number;
    location?: string;
    color?: string;
  };
  onViewDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
  onAssignDriver?: (id: string) => void;
  onScheduleMaintenance?: (id: string) => void;
  onDeactivate?: (id: string) => void;
}

export const VehicleCard = ({
  vehicle,
  onViewDetails,
  onEdit,
  onAssignDriver,
  onScheduleMaintenance,
  onDeactivate
}: VehicleCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card className="backdrop-blur-xl bg-white/80 dark:bg-card/80 border border-gray-200/50 dark:border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                <Car className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {vehicle.brand} {vehicle.model}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {vehicle.type} • {vehicle.year}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onViewDetails && (
                  <DropdownMenuItem onClick={() => onViewDetails(vehicle.id)}>
                    Voir détails
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(vehicle.id)}>
                    Modifier
                  </DropdownMenuItem>
                )}
                {onAssignDriver && (
                  <DropdownMenuItem onClick={() => onAssignDriver(vehicle.id)}>
                    Assigner chauffeur
                  </DropdownMenuItem>
                )}
                {onScheduleMaintenance && (
                  <DropdownMenuItem onClick={() => onScheduleMaintenance(vehicle.id)}>
                    Planifier maintenance
                  </DropdownMenuItem>
                )}
                {onDeactivate && (
                  <DropdownMenuItem 
                    onClick={() => onDeactivate(vehicle.id)}
                    className="text-red-600 dark:text-red-400"
                  >
                    Désactiver
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
              {vehicle.plate}
            </span>
            <StatusBadge status={vehicle.status} size="sm" />
          </div>

          <div className="space-y-2.5 mb-4">
            {vehicle.driverName && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Chauffeur: <span className="font-medium text-gray-900 dark:text-white">{vehicle.driverName}</span></span>
              </div>
            )}

            {vehicle.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{vehicle.location}</span>
              </div>
            )}

            {vehicle.mileage !== undefined && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Gauge className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{vehicle.mileage.toLocaleString()} km</span>
              </div>
            )}

            {vehicle.lastService && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Dernier entretien: {vehicle.lastService}</span>
              </div>
            )}

            {vehicle.color && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: vehicle.color }}
                />
                <span className="capitalize">{vehicle.color}</span>
              </div>
            )}
          </div>

          {onViewDetails && (
            <Button
              size="sm"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onViewDetails(vehicle.id)}
            >
              Voir détails
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
