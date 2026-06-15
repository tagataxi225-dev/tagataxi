/**
 * 🔵 Taxi Debug Panel — visible on native+DEV or ?taxiDebug=1
 */
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { LocationData } from '@/types/location';

let _isNative = false;
try {
  const { Capacitor } = require('@capacitor/core');
  _isNative = Capacitor.isNativePlatform();
} catch {}

interface TaxiDebugPanelProps {
  user: User | null;
  sessionReady: boolean;
  pickupLocation: LocationData | null;
  destinationLocation: LocationData | null;
  activeBookingId: string | null;
  isSearching: boolean;
  searchProgress: { radius: number; driversFound: number; status: string };
}

export default function TaxiDebugPanel({
  user, sessionReady, pickupLocation, destinationLocation,
  activeBookingId, isSearching, searchProgress
}: TaxiDebugPanelProps) {
  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const shouldShow = import.meta.env.DEV && _isNative;
    const urlDebug = new URLSearchParams(window.location.search).get('taxiDebug') === '1';
    setVisible(shouldShow || urlDebug);
  }, []);

  if (!visible) return null;

  const mapsLoaded = !!(window as any).google?.maps?.Map;
  const mapboxLoaded = !!(window as any).mapboxgl;

  const lines = [
    `Auth: ${sessionReady ? (user ? `✅ ${user.id.slice(0, 8)}…` : '❌ No user') : '⏳ Loading...'}`,
    `Maps: Google=${mapsLoaded ? '✅' : '❌'} Mapbox=${mapboxLoaded ? '✅' : '—'}`,
    `Pickup: ${pickupLocation ? `${pickupLocation.type} (${pickupLocation.lat.toFixed(4)},${pickupLocation.lng.toFixed(4)})` : '❌ null'}`,
    `Dest: ${destinationLocation ? destinationLocation.address?.slice(0, 30) : '❌ null'}`,
    `Booking: ${activeBookingId ? activeBookingId.slice(0, 8) + '…' : '—'} | ${searchProgress.status}`,
    `Search: ${isSearching ? `🔍 r=${searchProgress.radius}km d=${searchProgress.driversFound}` : 'idle'}`,
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] pointer-events-auto" style={{ bottom: 'calc(55vh + 8px)' }}>
      <div 
        className="bg-blue-600 text-white px-3 py-1 flex items-center justify-between cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="text-[10px] font-bold">🔵 TAXI DEBUG</span>
        <span className="text-[10px]">{collapsed ? '▲' : '▼'}</span>
      </div>
      
      {!collapsed && (
        <div className="bg-black/95 text-white p-2 space-y-0.5 max-h-[25vh] overflow-y-auto">
          {lines.map((line, i) => (
            <div key={i} className="text-[10px] font-mono leading-tight text-gray-300">{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
