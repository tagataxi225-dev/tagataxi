import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Check, Loader2, AlertCircle } from 'lucide-react';
import { useDriverCity } from '@/hooks/useDriverCity';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const CITY_INFO = {
  'Kinshasa': {
    description: 'Capitale de la RDC',
    zones: 10,
    currency: 'XOF'
  },
  'Lubumbashi': {
    description: 'Capitale du Haut-Katanga',
    zones: 5,
    currency: 'XOF'
  },
  'Kolwezi': {
    description: 'Ville minière',
    zones: 4,
    currency: 'XOF'
  },
  'Abidjan': {
    description: 'Capitale économique de la Côte d\'Ivoire',
    zones: 6,
    currency: 'XOF'
  }
};

export const CityManagementPanel: React.FC = () => {
  const { 
    city: driverCity, 
    loading, 
    availableCities,
    updateCity 
  } = useDriverCity();
  
  const isUpdating = updateCity.isPending;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const handleCityChange = async (city: string) => {
    setSelectedCity(city);
    
    try {
      await updateCity.mutateAsync(city as any);
      toast.success(`Ville changée vers ${city}`, {
        description: 'Vos zones de service ont été mises à jour'
      });
      setDialogOpen(false);
    } catch (error) {
      console.error('Erreur changement ville:', error);
      toast.error('Erreur lors du changement de ville');
    } finally {
      setSelectedCity(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentCityInfo = driverCity ? CITY_INFO[driverCity as keyof typeof CITY_INFO] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span>Ville de service</span>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Changer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Choisir votre ville de service</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-4">
                {availableCities.map((city) => {
                  const cityInfo = CITY_INFO[city as keyof typeof CITY_INFO];
                  if (!cityInfo) return null;
                  const isActive = city === driverCity;
                  const isSelecting = city === selectedCity;

                  return (
                    <motion.button
                      key={city}
                      onClick={() => !isActive && handleCityChange(city)}
                      disabled={isActive || isUpdating}
                      whileHover={{ scale: isActive ? 1 : 1.02 }}
                      whileTap={{ scale: isActive ? 1 : 0.98 }}
                      className={`
                        w-full p-4 rounded-lg border-2 transition-all text-left
                        ${isActive 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50 hover:bg-accent'
                        }
                        ${isUpdating && !isActive ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{city}</h3>
                            {isActive && (
                              <Badge variant="default" className="text-xs">
                                Actuelle
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {cityInfo.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {cityInfo.zones} zones disponibles
                            </span>
                            <span className="text-xs text-muted-foreground">
                              • Devise: {cityInfo.currency}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          {isSelecting ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          ) : isActive ? (
                            <Check className="h-5 w-5 text-primary" />
                          ) : (
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {driverCity && currentCityInfo ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div>
                <h3 className="font-semibold text-foreground">{driverCity}</h3>
                <p className="text-sm text-muted-foreground">
                  {currentCityInfo.description}
                </p>
              </div>
              <Badge variant="default">
                {currentCityInfo.zones} zones
              </Badge>
            </div>
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Vous recevrez uniquement les courses dans les zones de <strong>{driverCity}</strong>
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Aucune ville configurée
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => setDialogOpen(true)}
            >
              Choisir une ville
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
