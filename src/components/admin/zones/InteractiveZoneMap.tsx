import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMapsService } from '@/services/googleMapsService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Pencil,
  Trash2,
  Square,
  Circle,
  Save,
  X,
  MapPin,
  Settings,
} from 'lucide-react';
import { Zone } from '@/hooks/useZoneManagement';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    google: any;
  }
}

interface InteractiveZoneMapProps {
  zones: Zone[];
  onZoneCreate: (zone: Partial<Zone>) => Promise<void>;
  onZoneUpdate: (zoneId: string, updates: Partial<Zone>) => Promise<void>;
  onZoneDelete: (zoneId: string) => Promise<void>;
  selectedZoneId?: string;
  onZoneSelect: (zoneId: string | null) => void;
  className?: string;
}

export const InteractiveZoneMap: React.FC<InteractiveZoneMapProps> = ({
  zones,
  onZoneCreate,
  onZoneUpdate,
  onZoneDelete,
  selectedZoneId,
  onZoneSelect,
  className,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [drawingManager, setDrawingManager] = useState<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'rectangle' | 'circle' | null>(null);
  const [zonePolygons, setZonePolygons] = useState<Record<string, any>>({});
  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const { toast } = useToast();

  // Couleurs pour les zones selon leur statut
  const getZoneColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#22c55e'; // Vert
      case 'inactive':
        return '#ef4444'; // Rouge
      case 'maintenance':
        return '#f59e0b'; // Orange
      default:
        return '#6b7280'; // Gris
    }
  };

  // Initialiser Google Maps
  const initializeMap = useCallback(async () => {
    try {
      await GoogleMapsService.getApiKey();
      
      if (!window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${await GoogleMapsService.getApiKey()}&libraries=drawing,geometry`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        
        script.onload = () => {
          createMap();
        };
      } else {
        createMap();
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de Google Maps:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger Google Maps",
        variant: "destructive",
      });
    }
  }, []);

  const createMap = () => {
    if (!mapRef.current || !window.google) return;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { lat: -4.3217, lng: 15.3069 }, // Kinshasa par défaut
      zoom: 11,
      mapTypeId: 'roadmap',
      styles: [
        {
          featureType: 'administrative',
          elementType: 'geometry',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'poi',
          elementType: 'all',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    const drawingManagerInstance = new window.google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        fillColor: '#3b82f6',
        fillOpacity: 0.3,
        strokeColor: '#3b82f6',
        strokeWeight: 2,
        editable: true,
        draggable: true,
      },
      rectangleOptions: {
        fillColor: '#3b82f6',
        fillOpacity: 0.3,
        strokeColor: '#3b82f6',
        strokeWeight: 2,
        editable: true,
        draggable: true,
      },
      circleOptions: {
        fillColor: '#3b82f6',
        fillOpacity: 0.3,
        strokeColor: '#3b82f6',
        strokeWeight: 2,
        editable: true,
        draggable: true,
      },
    });

    drawingManagerInstance.setMap(mapInstance);

    // Écouter les événements de dessin
    window.google.maps.event.addListener(drawingManagerInstance, 'overlaycomplete', (event: any) => {
      handleShapeComplete(event);
    });

    setMap(mapInstance);
    setDrawingManager(drawingManagerInstance);
  };

  // Gérer la fin du dessin d'une forme
  const handleShapeComplete = (event: any) => {
    const shape = event.overlay;
    const type = event.type;

    let coordinates: Array<{ lat: number; lng: number }> = [];
    let center: { lat: number; lng: number };

    if (type === 'polygon') {
      const path = shape.getPath();
      for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i);
        coordinates.push({ lat: point.lat(), lng: point.lng() });
      }
      center = getCenterFromPolygon(coordinates);
    } else if (type === 'rectangle') {
      const bounds = shape.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      coordinates = [
        { lat: ne.lat(), lng: ne.lng() },
        { lat: ne.lat(), lng: sw.lng() },
        { lat: sw.lat(), lng: sw.lng() },
        { lat: sw.lat(), lng: ne.lng() },
      ];
      center = bounds.getCenter().toJSON();
    } else if (type === 'circle') {
      const centerPoint = shape.getCenter();
      const radius = shape.getRadius();
      // Convertir le cercle en polygone
      coordinates = getPolygonFromCircle(centerPoint, radius);
      center = centerPoint.toJSON();
    }

    // Demander le nom de la zone
    const zoneName = prompt('Nom de la nouvelle zone:');
    if (!zoneName) {
      shape.setMap(null);
      return;
    }

    // Créer la zone
    const newZone: Partial<Zone> = {
      name: zoneName,
      zone_type: 'custom',
      city: 'Kinshasa',
      coordinates,
      center,
      is_active: true,
      status: 'active',
      surge_multiplier: 1.0,
    };

    onZoneCreate(newZone).then(() => {
      shape.setMap(null);
      setIsDrawing(false);
      setDrawingMode(null);
      if (drawingManager) {
        drawingManager.setDrawingMode(null);
      }
    }).catch(() => {
      shape.setMap(null);
    });
  };

  // Calculer le centre d'un polygone
  const getCenterFromPolygon = (coordinates: Array<{ lat: number; lng: number }>) => {
    let lat = 0;
    let lng = 0;
    coordinates.forEach(coord => {
      lat += coord.lat;
      lng += coord.lng;
    });
    return {
      lat: lat / coordinates.length,
      lng: lng / coordinates.length,
    };
  };

  // Convertir un cercle en polygone
  const getPolygonFromCircle = (center: any, radius: number, points: number = 32) => {
    const coordinates: Array<{ lat: number; lng: number }> = [];
    for (let i = 0; i < points; i++) {
      const angle = (i * 360) / points;
      const point = window.google.maps.geometry.spherical.computeOffset(center, radius, angle);
      coordinates.push({ lat: point.lat(), lng: point.lng() });
    }
    return coordinates;
  };

  // Afficher les zones existantes sur la carte
  const renderZones = useCallback(() => {
    if (!map || !window.google) return;

    // Supprimer les polygones existants
    Object.values(zonePolygons).forEach((polygon: any) => {
      polygon.setMap(null);
    });

    const newZonePolygons: Record<string, any> = {};

    zones.forEach(zone => {
      if (!zone.coordinates || !Array.isArray(zone.coordinates) || zone.coordinates.length === 0) return;

      const polygon = new window.google.maps.Polygon({
        paths: zone.coordinates,
        fillColor: getZoneColor(zone.status),
        fillOpacity: 0.3,
        strokeColor: getZoneColor(zone.status),
        strokeWeight: selectedZoneId === zone.id ? 3 : 2,
        strokeOpacity: selectedZoneId === zone.id ? 1 : 0.7,
        editable: editingZone === zone.id,
        draggable: editingZone === zone.id,
      });

      polygon.setMap(map);

      // Ajouter un écouteur de clic
      polygon.addListener('click', () => {
        onZoneSelect(zone.id);
      });

      // Si la zone est en mode édition, écouter les changements
      if (editingZone === zone.id) {
        polygon.addListener('mouseup', () => {
          const path = polygon.getPath();
          const coordinates: Array<{ lat: number; lng: number }> = [];
          for (let i = 0; i < path.getLength(); i++) {
            const point = path.getAt(i);
            coordinates.push({ lat: point.lat(), lng: point.lng() });
          }
          const center = getCenterFromPolygon(coordinates);
          
          onZoneUpdate(zone.id, { coordinates, center });
        });
      }

      newZonePolygons[zone.id] = polygon;
    });

    setZonePolygons(newZonePolygons);
  }, [map, zones, selectedZoneId, editingZone, onZoneSelect, onZoneUpdate]);

  // Activer le mode dessin
  const startDrawing = (mode: 'polygon' | 'rectangle' | 'circle') => {
    if (!drawingManager) return;

    setIsDrawing(true);
    setDrawingMode(mode);

    const drawingModes = {
      polygon: window.google.maps.drawing.OverlayType.POLYGON,
      rectangle: window.google.maps.drawing.OverlayType.RECTANGLE,
      circle: window.google.maps.drawing.OverlayType.CIRCLE,
    };

    drawingManager.setDrawingMode(drawingModes[mode]);
  };

  // Arrêter le mode dessin
  const stopDrawing = () => {
    setIsDrawing(false);
    setDrawingMode(null);
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }
  };

  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  useEffect(() => {
    renderZones();
  }, [renderZones]);

  const selectedZone = zones.find(z => z.id === selectedZoneId);

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-4 gap-6 ${className}`}>
      {/* Outils de dessin */}
      <Card className="lg:col-span-1 p-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Outils de dessin</h3>
          
          <div className="space-y-2">
            <Button
              onClick={() => startDrawing('polygon')}
              disabled={isDrawing}
              variant={drawingMode === 'polygon' ? 'default' : 'outline'}
              className="w-full justify-start"
            >
              <Square className="mr-2 h-4 w-4" />
              Polygone
            </Button>
            
            <Button
              onClick={() => startDrawing('rectangle')}
              disabled={isDrawing}
              variant={drawingMode === 'rectangle' ? 'default' : 'outline'}
              className="w-full justify-start"
            >
              <Square className="mr-2 h-4 w-4" />
              Rectangle
            </Button>
            
            <Button
              onClick={() => startDrawing('circle')}
              disabled={isDrawing}
              variant={drawingMode === 'circle' ? 'default' : 'outline'}
              className="w-full justify-start"
            >
              <Circle className="mr-2 h-4 w-4" />
              Cercle
            </Button>
          </div>

          {isDrawing && (
            <Button
              onClick={stopDrawing}
              variant="destructive"
              className="w-full"
            >
              <X className="mr-2 h-4 w-4" />
              Annuler
            </Button>
          )}

          <Separator />

          {/* Informations sur la zone sélectionnée */}
          {selectedZone && (
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Zone sélectionnée</h4>
              
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Nom:</span> {selectedZone.name}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Statut:</span>
                  <Badge 
                    variant={selectedZone.status === 'active' ? 'default' : 'secondary'}
                  >
                    {selectedZone.status}
                  </Badge>
                </div>

                <div className="text-sm">
                  <span className="font-medium">Multiplicateur:</span> {selectedZone.surge_multiplier}x
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingZone(editingZone === selectedZone.id ? null : selectedZone.id)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm('Supprimer cette zone ?')) {
                      onZoneDelete(selectedZone.id);
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Carte interactive */}
      <Card className="lg:col-span-3 p-0 overflow-hidden">
        <div 
          ref={mapRef} 
          className="w-full h-[600px]"
          style={{ minHeight: '600px' }}
        />
      </Card>
    </div>
  );
};