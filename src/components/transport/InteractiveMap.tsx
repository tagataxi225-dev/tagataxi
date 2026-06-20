import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Locate, Minus, Plus, Radio } from 'lucide-react';
import { nativeGeolocationService } from '@/services/nativeGeolocationService';

interface Location {
  address: string;
  coordinates: [number, number];
}

interface InteractiveMapProps {
  pickup?: Location;
  destination?: Location;
  onLocationSelect?: (location: Location) => void;
  showRoute?: boolean;
  driverLocation?: [number, number];
  className?: string;
}

const InteractiveMap = ({ 
  pickup, destination, onLocationSelect, 
  showRoute = false, driverLocation,
  className = "h-[300px]" 
}: InteractiveMapProps) => {
  const [zoom, setZoom] = useState(12);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const abidjanCenter: [number, number] = [-4.0083, 5.3600];

  useEffect(() => {
    nativeGeolocationService.getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000
    }).then((position) => {
      setUserLocation([position.lng, position.lat]);
    }).catch((error) => {
      console.log('Geolocation error:', error);
      setUserLocation(abidjanCenter);
    });
  }, []);

  const handleLocationClick = async () => {
    setIsLocating(true);
    try {
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      const newLocation: Location = {
        address: "Ma position actuelle",
        coordinates: [position.lng, position.lat]
      };
      setUserLocation([position.lng, position.lat]);
      onLocationSelect?.(newLocation);
    } catch (err) {
      console.error('Geolocation error:', err);
    } finally {
      setIsLocating(false);
    }
  };

  const calculateDistance = (coord1: [number, number], coord2: [number, number]) => {
    const R = 6371;
    const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
    const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div className={`relative bg-white rounded-2xl border border-grey-100 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50">
        <div className="absolute inset-0">
          <svg className="w-full h-full opacity-20">
            <path d="M0,180 Q100,160 200,170 T400,180 Q500,185 600,175" stroke="#4FACFE" strokeWidth="12" fill="none" />
          </svg>
        </div>
        
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full">
            {Array.from({ length: 8 }, (_, i) => (
              <line key={`v-${i}`} x1={i * 50 + 25} y1="0" x2={i * 50 + 25} y2="100%" stroke="#666" strokeWidth="1" />
            ))}
            {Array.from({ length: 6 }, (_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 50 + 25} x2="100%" y2={i * 50 + 25} stroke="#666" strokeWidth="1" />
            ))}
          </svg>
        </div>

        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-medium">Gombe</div>
        <div className="absolute top-12 right-8 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-medium">Bandalungwa</div>
        <div className="absolute bottom-16 left-8 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-medium">Kalamu</div>
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-medium">Ngaliema</div>

        {userLocation && (
          <div className="absolute" style={{ left: '45%', top: '55%', transform: 'translate(-50%, -50%)' }}>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping" />
              <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-2 shadow-xl border-2 border-white">
                <Radio className="h-4 w-4 text-white animate-pulse" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        )}

        {pickup && (
          <div className="absolute w-6 h-6 flex items-center justify-center" style={{ left: '30%', top: '40%', transform: 'translate(-50%, -50%)' }}>
            <div className="w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        )}

        {destination && (
          <div className="absolute w-6 h-6 flex items-center justify-center" style={{ left: '70%', top: '30%', transform: 'translate(-50%, -50%)' }}>
            <div className="w-6 h-6 bg-secondary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <MapPin className="w-3 h-3 text-white" />
            </div>
          </div>
        )}

        {driverLocation && (
          <div className="absolute w-8 h-8 flex items-center justify-center" style={{ left: '35%', top: '45%', transform: 'translate(-50%, -50%)' }}>
            <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <Navigation className="w-4 h-4 text-white" />
            </div>
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-30"></div>
          </div>
        )}

        {showRoute && pickup && destination && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <path d="M 30% 40% Q 50% 25% 70% 30%" stroke="#ec2027" strokeWidth="3" fill="none" strokeDasharray="8,4" className="animate-pulse" />
          </svg>
        )}

        {pickup && destination && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur px-4 py-2 rounded-xl shadow-lg">
            <div className="text-center">
              <p className="text-sm font-semibold text-grey-900">{calculateDistance(pickup.coordinates, destination.coordinates).toFixed(1)} km</p>
              <p className="text-xs text-grey-600">~{Math.ceil(calculateDistance(pickup.coordinates, destination.coordinates) * 3)} min</p>
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button size="sm" variant="outline" className="w-10 h-10 p-0 rounded-full bg-white/90 backdrop-blur border-grey-200" onClick={() => setZoom(Math.min(zoom + 1, 18))}>
          <Plus className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" className="w-10 h-10 p-0 rounded-full bg-white/90 backdrop-blur border-grey-200" onClick={() => setZoom(Math.max(zoom - 1, 8))}>
          <Minus className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" className="w-10 h-10 p-0 rounded-full bg-white/90 backdrop-blur border-grey-200" onClick={handleLocationClick} disabled={isLocating}>
          <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {userLocation && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg">
          <p className="text-xs font-medium text-grey-900">Abidjan, Côte d'Ivoire</p>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;
