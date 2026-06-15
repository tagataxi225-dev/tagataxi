// Google Maps ambient type declarations for bundler moduleResolution
declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element, opts?: any);
      setCenter(latLng: any): void;
      setZoom(zoom: number): void;
      getZoom(): number | undefined;
      setTilt(tilt: number): void;
      getTilt(): number;
      setHeading(heading: number): void;
      getHeading(): number;
      fitBounds(bounds: any, padding?: any): void;
      panTo(latLng: any): void;
      addListener(eventName: string, handler: (...args: any[]) => void): any;
      getCenter(): LatLng | undefined;
      getBounds(): LatLngBounds | undefined;
      setOptions(options: any): void;
      setMapTypeId(mapTypeId: string): void;
      get(key: string): any;
      controls: any[];
    }
    class LatLng {
      constructor(lat: number | LatLngLiteral, lng?: number);
      lat(): number;
      lng(): number;
      toJSON(): { lat: number; lng: number };
    }
    class LatLngBounds {
      constructor(sw?: any, ne?: any);
      extend(point: any): LatLngBounds;
      getCenter(): LatLng;
      contains(latLng: any): boolean;
      getNorthEast(): LatLng;
      getSouthWest(): LatLng;
    }
    interface LatLngLiteral { lat: number; lng: number; }
    interface MapOptions { [key: string]: any; }
    interface MapMouseEvent { latLng: LatLng | null; domEvent: Event; stop(): void; }
    interface MapTypeStyle { elementType?: string; featureType?: string; stylers: any[]; }
    interface MarkerOptions { position?: LatLng | LatLngLiteral; map?: Map; title?: string; icon?: any; label?: any; draggable?: boolean; visible?: boolean; animation?: any; zIndex?: number; [key: string]: any; }
    class Marker {
      constructor(opts?: MarkerOptions);
      setMap(map: Map | null): void;
      setPosition(latLng: any): void;
      getPosition(): LatLng | null | undefined;
      setIcon(icon: any): void;
      getIcon(): any;
      setTitle(title: string): void;
      addListener(eventName: string, handler: (...args: any[]) => void): any;
      setVisible(visible: boolean): void;
      setAnimation(animation: any): void;
      setDraggable(draggable: boolean): void;
    }
    class Polyline {
      constructor(opts?: any);
      setMap(map: Map | null): void;
      setPath(path: any[]): void;
      getPath(): any;
      setOptions(options: any): void;
    }
    class Circle {
      constructor(opts?: any);
      setMap(map: Map | null): void;
      setCenter(center: any): void;
      setRadius(radius: number): void;
      setOptions(options: any): void;
    }
    class TrafficLayer {
      constructor(opts?: any);
      setMap(map: Map | null): void;
    }
    class DirectionsService { route(request: any, callback?: any): Promise<any>; }
    class DirectionsRenderer { constructor(opts?: any); setMap(map: Map | null): void; setDirections(directions: any): void; setOptions(options: any): void; }
    class Geocoder { geocode(request: any, callback?: any): Promise<any>; }
    class InfoWindow { constructor(opts?: any); open(mapOrOpts?: any, anchor?: any): void; close(): void; setContent(content: any): void; }
    class Size { constructor(width: number, height: number, widthUnit?: string, heightUnit?: string); width: number; height: number; }
    class Point { constructor(x: number, y: number); x: number; y: number; }
    namespace places {
      class AutocompleteService { getPlacePredictions(request: any, callback?: any): Promise<any>; }
      class AutocompleteSessionToken { constructor(); }
      class PlacesService { constructor(a: any); getDetails(r: any, c: any): void; nearbySearch(r: any, c: any): void; }
      class Autocomplete { constructor(i: HTMLInputElement, o?: any); addListener(e: string, h: () => void): any; getPlace(): any; setBounds(b: any): void; }
      interface AutocompletionRequest { input: string; sessionToken?: AutocompleteSessionToken; [key: string]: any; }
      interface PlaceDetailsRequest { placeId: string; fields?: string[]; [key: string]: any; }
      const PlacesServiceStatus: Record<string, string>;
    }
    namespace geometry { namespace spherical { function computeDistanceBetween(from: any, to: any): number; function computeHeading(from: any, to: any): number; function interpolate(from: any, to: any, fraction: number): LatLng; } }
    namespace marker {
      class AdvancedMarkerElement { constructor(o?: any); map: Map | null; position: any; content: HTMLElement | null; title: string; addListener(e: string, h: (...a: any[]) => void): any; element: HTMLElement; }
      class PinElement { constructor(o?: any); element: HTMLElement; }
    }
    namespace event {
      function removeListener(l: any): void;
      function clearInstanceListeners(i: any): void;
      function addListener(i: any, e: string, h: any): any;
      function addListenerOnce(i: any, e: string, h: any): any;
      function addDomListener(el: any, e: string, h: any): any;
    }
    const ControlPosition: Record<string, number>;
    const Animation: Record<string, number>;
    const SymbolPath: Record<string, number>;
    const DirectionsStatus: Record<string, string>;
    const GeocoderStatus: Record<string, string>;
    const TravelMode: Record<string, string>;
    const TrafficModel: Record<string, string>;
    const UnitSystem: Record<string, number>;
    const MapTypeId: Record<string, string>;
    interface Icon { url: string; size?: Size; origin?: Point; anchor?: Point; scaledSize?: Size; }
    interface Symbol { path: any; fillColor?: string; fillOpacity?: number; strokeColor?: string; strokeOpacity?: number; strokeWeight?: number; scale?: number; rotation?: number; anchor?: Point; }
  }
}
