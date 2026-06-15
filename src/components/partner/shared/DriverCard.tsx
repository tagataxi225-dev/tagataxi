import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StatusBadge, StatusType } from './StatusBadge';
import { Phone, Mail, Car, MapPin, Star, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DriverCardProps {
  driver: {
    id: string;
    name: string;
    avatar?: string;
    phone: string;
    email: string;
    status: StatusType;
    vehicleType?: string;
    vehiclePlate?: string;
    rating?: number;
    totalRides?: number;
    location?: string;
  };
  onViewDetails?: (id: string) => void;
  onCall?: (phone: string) => void;
  onMessage?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDeactivate?: (id: string) => void;
}

export const DriverCard = ({
  driver,
  onViewDetails,
  onCall,
  onMessage,
  onEdit,
  onDeactivate
}: DriverCardProps) => {
  const initials = driver.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 ring-2 ring-emerald-500/20">
                <AvatarImage src={driver.avatar} alt={driver.name} />
                <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {driver.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={driver.status} size="sm" />
                  {driver.rating && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="font-medium">{driver.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
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
                  <DropdownMenuItem onClick={() => onViewDetails(driver.id)}>
                    Voir détails
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(driver.id)}>
                    Modifier
                  </DropdownMenuItem>
                )}
                {onMessage && (
                  <DropdownMenuItem onClick={() => onMessage(driver.id)}>
                    Envoyer message
                  </DropdownMenuItem>
                )}
                {onDeactivate && (
                  <DropdownMenuItem 
                    onClick={() => onDeactivate(driver.id)}
                    className="text-red-600 dark:text-red-400"
                  >
                    Désactiver
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2.5">
            {driver.vehicleType && driver.vehiclePlate && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Car className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{driver.vehicleType}</span>
                <span className="text-gray-400">•</span>
                <span className="font-mono font-medium">{driver.vehiclePlate}</span>
              </div>
            )}

            {driver.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{driver.location}</span>
              </div>
            )}

            {driver.totalRides !== undefined && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {driver.totalRides} courses
                </span>
                <span className="text-gray-400">terminées</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {onCall && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onCall(driver.phone)}
              >
                <Phone className="w-4 h-4 mr-2" />
                Appeler
              </Button>
            )}
            {onViewDetails && (
              <Button
                size="sm"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => onViewDetails(driver.id)}
              >
                Voir profil
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
