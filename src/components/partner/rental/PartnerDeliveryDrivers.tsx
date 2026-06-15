import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Package, 
  Plus, 
  Search, 
  Star, 
  Phone, 
  Mail, 
  UserMinus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Percent
} from 'lucide-react';
import { DriverCommissionRateDialog } from '../DriverCommissionRateDialog';
import { usePartnerDrivers } from '@/hooks/usePartnerDrivers';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function PartnerDeliveryDrivers() {
  const { 
    loading, 
    drivers, 
    addingDriver, 
    driverPreview,
    validatingCode,
    validateDriverCode,
    clearDriverPreview,
    addDriverByCode, 
    removeDriver 
  } = usePartnerDrivers();

  const [driverCode, setDriverCode] = useState('');
  const [commissionDialogDriver, setCommissionDialogDriver] = useState<any>(null);

  // Filter only delivery drivers
  const deliveryDrivers = drivers.filter(d => 
    d.vehicle_type?.toLowerCase().includes('moto') || 
    d.vehicle_type?.toLowerCase().includes('scooter') ||
    d.vehicle_type?.toLowerCase().includes('vélo') ||
    !d.vehicle_type // Include drivers without vehicle type for now
  );

  const handleValidateCode = async () => {
    if (!driverCode.trim()) {
      toast.error('Veuillez entrer un Code Driver');
      return;
    }
    await validateDriverCode(driverCode);
  };

  const handleAddDriver = async () => {
    const success = await addDriverByCode(driverCode);
    if (success) {
      setDriverCode('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Driver Section */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Ajouter un Livreur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Entrez le Code Driver du livreur..."
                value={driverCode}
                onChange={(e) => {
                  setDriverCode(e.target.value.toUpperCase());
                  clearDriverPreview();
                }}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={handleValidateCode}
              disabled={validatingCode || !driverCode.trim()}
              variant="outline"
            >
              {validatingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Vérifier'}
            </Button>
          </div>

          {/* Driver Preview */}
          {driverPreview && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-green-300">
                    <AvatarImage src={driverPreview.profile_photo_url || ''} />
                    <AvatarFallback className="bg-green-100 text-green-700">
                      {driverPreview.display_name?.charAt(0) || 'L'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <h4 className="font-semibold text-green-800">{driverPreview.display_name}</h4>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-green-700">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {driverPreview.rating_average?.toFixed(1) || 'N/A'}
                      </span>
                      <span>{driverPreview.total_rides || 0} livraisons</span>
                      {driverPreview.vehicle_type && (
                        <Badge variant="outline" className="text-xs">
                          {driverPreview.vehicle_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button onClick={handleAddDriver} disabled={addingDriver} className="bg-green-600 hover:bg-green-700">
                    {addingDriver ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Comment ça marche ?</p>
              <p className="text-blue-600 mt-1">
                Les livreurs génèrent leur Code Driver dans l'application. 
                Demandez-leur de vous partager ce code pour les ajouter à votre flotte.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drivers List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Mes Livreurs ({deliveryDrivers.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : deliveryDrivers.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="font-medium text-muted-foreground">Aucun livreur dans votre flotte</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ajoutez des livreurs en utilisant leur Code Driver
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {deliveryDrivers.map((driver) => (
                <div 
                  key={driver.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {driver.driver_name?.charAt(0) || 'L'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{driver.driver_name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {driver.driver_rating?.toFixed(1) || 'N/A'}
                      </span>
                      <span>{driver.driver_total_rides || 0} courses</span>
                    </div>
                    {driver.driver_phone && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {driver.driver_phone}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800">
                      {driver.commission_rate != null ? `${driver.commission_rate}%` : '0%'}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => setCommissionDialogDriver(driver)}
                    >
                      <Percent className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Retirer ce livreur ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {driver.driver_name} sera retiré de votre flotte. Il pourra rejoindre une autre flotte avec son Code Driver.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => removeDriver(driver.id, driver.driver_id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Retirer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DriverCommissionRateDialog
        open={!!commissionDialogDriver}
        onOpenChange={(open) => !open && setCommissionDialogDriver(null)}
        driver={commissionDialogDriver ? {
          id: commissionDialogDriver.id,
          driver_id: commissionDialogDriver.driver_id,
          driver_name: commissionDialogDriver.driver_name,
          commission_rate: commissionDialogDriver.commission_rate || 0
        } : null}
        onSuccess={() => setCommissionDialogDriver(null)}
      />
    </div>
  );
}
