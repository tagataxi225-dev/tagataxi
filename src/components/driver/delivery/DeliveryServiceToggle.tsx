/**
 * 📦 Toggle services de livraison avec validation véhicule
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  Info, 
  TrendingUp, 
  Lock,
  AlertCircle,
  DollarSign,
  Clock
} from 'lucide-react';
import { 
  useDeliveryServicePreferences, 
  DeliveryServiceType,
  SERVICE_DEFINITIONS 
} from '@/hooks/useDeliveryServicePreferences';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const DeliveryServiceToggle: React.FC = () => {
  const { 
    preferences, 
    vehicleClass, 
    activeServices,
    serviceStats,
    loading, 
    isServiceCompatible, 
    toggleService 
  } = useDeliveryServicePreferences();

  const [selectedService, setSelectedService] = useState<DeliveryServiceType | null>(null);

  const getServiceColor = (type: DeliveryServiceType) => {
    const colors = {
      flash: 'from-red-500 to-red-600',
      flex: 'from-green-500 to-green-600',
      maxicharge: 'from-purple-500 to-purple-600'
    };
    return colors[type];
  };

  const getServiceBgColor = (type: DeliveryServiceType, active: boolean) => {
    if (!active) return 'bg-muted';
    const colors = {
      flash: 'bg-red-50 dark:bg-red-950/20 border-red-200',
      flex: 'bg-green-50 dark:bg-green-950/20 border-green-200',
      maxicharge: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200'
    };
    return colors[type];
  };

  const getCompatibilityMessage = (type: DeliveryServiceType) => {
    const required = SERVICE_DEFINITIONS[type].vehicle_class_required;
    return `Compatible avec: ${required.join(', ')}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Services de livraison
            </span>
            <Badge variant="secondary" className="text-sm">
              {activeServices.length}/3 actifs
            </Badge>
          </CardTitle>
          <p className="text-sm opacity-90">
            Activez les services compatibles avec votre véhicule ({vehicleClass})
          </p>
        </CardHeader>
      </Card>

      {/* Liste des services */}
      <div className="space-y-4">
        {Object.entries(SERVICE_DEFINITIONS).map(([type, definition]) => {
          const serviceType = type as DeliveryServiceType;
          const isActive = preferences?.[serviceType]?.active || false;
          const isCompatible = isServiceCompatible(serviceType);
          const stats = serviceStats?.[serviceType];

          return (
            <motion.div
              key={serviceType}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className={`${getServiceBgColor(serviceType, isActive)} transition-all`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Info service */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{definition.icon}</span>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg capitalize">
                            {serviceType}
                            {!isCompatible && (
                              <Lock className="inline-block w-4 h-4 ml-2 text-muted-foreground" />
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {definition.description}
                          </p>
                        </div>
                      </div>

                      {/* Stats si actif */}
                      {isActive && stats && (
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Package className="w-4 h-4" />
                            <span>{stats.count} livraisons</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <DollarSign className="w-4 h-4" />
                            <span>{stats.earnings.toLocaleString()} CDF</span>
                          </div>
                        </div>
                      )}

                      {/* Message compatibilité */}
                      {!isCompatible && (
                        <Alert className="mt-3 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          <AlertDescription className="text-xs text-orange-700 dark:text-orange-400">
                            {getCompatibilityMessage(serviceType)}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {/* Toggle + Info */}
                    <div className="flex flex-col items-end gap-2">
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => toggleService.mutate(serviceType)}
                        disabled={!isCompatible || toggleService.isPending}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedService(serviceType)}
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Badge statut */}
                  <div className="mt-3 flex items-center gap-2">
                    {isActive ? (
                      <Badge className="bg-green-600 text-white">
                        ✓ Actif
                      </Badge>
                    ) : isCompatible ? (
                      <Badge variant="outline">
                        Disponible
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground">
                        <Lock className="w-3 h-3 mr-1" />
                        Véhicule incompatible
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Info générale */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900 dark:text-blue-300">
            💡 <strong>Astuce:</strong> Plus vous activez de services, plus vous recevez d'opportunités de livraison. 
            Le type de service dépend de votre véhicule actuel.
          </p>
        </CardContent>
      </Card>

      {/* Modal détails service */}
      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">
                {selectedService && SERVICE_DEFINITIONS[selectedService].icon}
              </span>
              Service {selectedService}
            </DialogTitle>
            <DialogDescription>
              {selectedService && SERVICE_DEFINITIONS[selectedService].description}
            </DialogDescription>
          </DialogHeader>

          {selectedService && (
            <div className="space-y-4">
              {/* Tarification */}
              <div>
                <h4 className="font-semibold mb-2">📊 Tarification</h4>
                <div className="space-y-2 text-sm">
                  {selectedService === 'flash' && (
                    <>
                      <p>• Base: 5000 CDF</p>
                      <p>• Par km: 500 CDF</p>
                      <p>• Délai: 5-15 minutes</p>
                    </>
                  )}
                  {selectedService === 'flex' && (
                    <>
                      <p>• Base: 3000 CDF</p>
                      <p>• Par km: 300 CDF</p>
                      <p>• Délai: 30-60 minutes</p>
                    </>
                  )}
                  {selectedService === 'maxicharge' && (
                    <>
                      <p>• Base: 8000 CDF</p>
                      <p>• Par km: 800 CDF</p>
                      <p>• Délai: 1-2 heures</p>
                    </>
                  )}
                </div>
              </div>

              {/* Véhicules compatibles */}
              <div>
                <h4 className="font-semibold mb-2">🚗 Véhicules compatibles</h4>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_DEFINITIONS[selectedService].vehicle_class_required.map((vc) => (
                    <Badge 
                      key={vc} 
                      variant={vehicleClass === vc ? 'default' : 'outline'}
                    >
                      {vc}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Stats si disponibles */}
              {serviceStats?.[selectedService] && (
                <div>
                  <h4 className="font-semibold mb-2">📈 Vos statistiques</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-primary">
                        {serviceStats[selectedService].count}
                      </p>
                      <p className="text-xs text-muted-foreground">Livraisons</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-primary">
                        {serviceStats[selectedService].earnings.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">CDF gagnés</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
