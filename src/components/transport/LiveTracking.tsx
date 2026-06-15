import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useRealtimeTracking } from '@/hooks/useRealtimeTracking';
import { useToast } from '@/hooks/use-toast';
import { FloatingSOS } from '@/components/emergency/FloatingSOS';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Route,
  CheckCircle,
  Car,
  Phone,
  MessageCircle
} from 'lucide-react';

interface LiveTrackingProps {
  bookingId: string;
  driverInfo: {
    name: string;
    phone: string;
    vehicle: string;
    plateNumber: string;
    rating: number;
  };
  tripInfo: {
    pickup: string;
    destination: string;
    estimatedDuration: number; // in minutes
    estimatedDistance: number; // in km
  };
  onTripComplete?: () => void;
}

const LiveTracking: React.FC<LiveTrackingProps> = ({
  bookingId,
  driverInfo,
  tripInfo,
  onTripComplete
}) => {
  const [tripStatus, setTripStatus] = useState<'waiting' | 'pickup' | 'enroute' | 'arrived'>('waiting');
  const [progress, setProgress] = useState(0);
  const [estimatedArrival, setEstimatedArrival] = useState<Date | null>(null);
  
  const { toast } = useToast();
  const geolocation = useGeolocation();
  const { 
    currentLocation, 
    isTracking,
    startTracking,
    stopTracking
  } = useRealtimeTracking();

  // Simulate trip progress for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(100, prev + 2);
        
        if (newProgress > 25 && tripStatus === 'waiting') {
          setTripStatus('pickup');
        } else if (newProgress > 50 && tripStatus === 'pickup') {
          setTripStatus('enroute');
        } else if (newProgress >= 100 && tripStatus === 'enroute') {
          setTripStatus('arrived');
          if (onTripComplete) {
            onTripComplete();
          }
        }
        
        return newProgress;
      });
      
      // Update ETA
      const remainingTime = (100 - progress) * (tripInfo.estimatedDuration / 100);
      setEstimatedArrival(new Date(Date.now() + remainingTime * 60000));
    }, 2000);

    return () => clearInterval(interval);
  }, [progress, tripStatus, tripInfo.estimatedDuration, onTripComplete]);

  const getStatusInfo = () => {
    switch (tripStatus) {
      case 'waiting':
        return {
          title: 'Chauffeur en route vers vous',
          description: 'Votre chauffeur se dirige vers le point de départ',
          color: 'bg-blue-500',
          icon: <Car className="w-5 h-5" />
        };
      case 'pickup':
        return {
          title: 'Chauffeur arrivé',
          description: 'Votre chauffeur vous attend au point de départ',
          color: 'bg-green-500',
          icon: <CheckCircle className="w-5 h-5" />
        };
      case 'enroute':
        return {
          title: 'En route vers la destination',
          description: 'Voyage en cours vers votre destination',
          color: 'bg-primary',
          icon: <Route className="w-5 h-5" />
        };
      case 'arrived':
        return {
          title: 'Arrivé à destination',
          description: 'Vous êtes arrivé à votre destination',
          color: 'bg-green-600',
          icon: <CheckCircle className="w-5 h-5" />
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleCallDriver = () => {
    // In a real app, this would initiate a call
    window.open(`tel:${driverInfo.phone}`);
  };

  const handleMessageDriver = () => {
    // In a real app, this would open a chat interface
    toast({
      title: "Messagerie",
      description: "Fonctionnalité de chat en cours de développement",
    });
  };

  return (
    <div className="space-y-6 relative">
      <FloatingSOS tripId={bookingId} />
      {/* Connection Status */}
      <Card className={`border-2 ${isTracking ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="font-medium">
              {isTracking ? 'Suivi en temps réel actif' : 'Mode démo - suivi simulé'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Trip Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${statusInfo.color} flex items-center justify-center text-white`}>
              {statusInfo.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{statusInfo.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progression du trajet</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {estimatedArrival && tripStatus !== 'arrived' && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>Arrivée estimée: {estimatedArrival.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Driver Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations chauffeur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{driverInfo.name}</p>
                <p className="text-sm text-muted-foreground">
                  {driverInfo.vehicle} • {driverInfo.plateNumber}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-xs ${i < Math.floor(driverInfo.rating) ? 'text-yellow-500' : 'text-gray-300'}`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">
                    {driverInfo.rating}/5
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCallDriver}
                  className="flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Appeler
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMessageDriver}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trip Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Détails du trajet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
              <div className="flex-1">
                <p className="text-sm font-medium">Départ</p>
                <p className="text-sm text-muted-foreground">{tripInfo.pickup}</p>
              </div>
            </div>
            
            <div className="ml-1 border-l-2 border-dashed border-muted-foreground/30 h-4" />
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
              <div className="flex-1">
                <p className="text-sm font-medium">Destination</p>
                <p className="text-sm text-muted-foreground">{tripInfo.destination}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Distance</p>
              <p className="font-medium">{tripInfo.estimatedDistance.toFixed(1)} km</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Durée estimée</p>
              <p className="font-medium">{tripInfo.estimatedDuration} min</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver Location */}
      {currentLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Position du chauffeur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Latitude:</span>
                <span className="text-sm font-mono">{currentLocation.lat.toFixed(6)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Longitude:</span>
                <span className="text-sm font-mono">{currentLocation.lng.toFixed(6)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Statut:</span>
                <Badge variant="default">En course</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Précision:</span>
                <span className="text-sm">GPS</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveTracking;