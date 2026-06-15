import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, MapPin, Car, Package, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDeliveryPricing } from '@/hooks/useDeliveryPricing';
import { getPlatformType, getOS, isMobileApp, isPWA } from '@/services/platformDetection';

const LOG_PREFIX = '[NATIVE-CHECK]';

type TestStatus = 'idle' | 'running' | 'pass' | 'fail';

interface TestResult {
  id: string;
  name: string;
  status: TestStatus;
  duration?: number;
  details?: string;
}

interface TestSection {
  title: string;
  icon: React.ReactNode;
  tests: TestResult[];
}

const statusIcon = (s: TestStatus) => {
  switch (s) {
    case 'idle': return '⬜';
    case 'running': return '⏳';
    case 'pass': return '✅';
    case 'fail': return '❌';
  }
};

export const NativeFeatureCheckDashboard: React.FC = () => {
  const { calculateDeliveryPrice, getServicePricing, isLoading: pricingLoading } = useDeliveryPricing();

  const initialSections = (): TestSection[] => [
    {
      title: '📍 LOCALISATION GPS',
      icon: <MapPin className="h-5 w-5" />,
      tests: [
        { id: 'gps-1', name: 'checkPermissions() → granted', status: 'idle' },
        { id: 'gps-2', name: 'getCurrentPosition() < 15s', status: 'idle' },
        { id: 'gps-3', name: 'Reset cache + retry GPS', status: 'idle' },
        { id: 'gps-4', name: 'Adresse enrichie (header)', status: 'idle' },
        { id: 'gps-5', name: 'Platform detection', status: 'idle' },
      ],
    },
    {
      title: '🚗 SERVICE TAXI',
      icon: <Car className="h-5 w-5" />,
      tests: [
        { id: 'taxi-1', name: 'Google Maps chargé', status: 'idle' },
        { id: 'taxi-2', name: 'Position client détectée', status: 'idle' },
        { id: 'taxi-3', name: 'Autocomplétion Google Places', status: 'idle' },
        { id: 'taxi-4', name: 'Types véhicules + prix', status: 'idle' },
        { id: 'taxi-5', name: 'Dispatch booking ready', status: 'idle' },
      ],
    },
    {
      title: '📦 SERVICE LIVRAISON',
      icon: <Package className="h-5 w-5" />,
      tests: [
        { id: 'del-1', name: 'GPS prérempli pickup', status: 'idle' },
        { id: 'del-2', name: 'Google Places destination', status: 'idle' },
        { id: 'del-3', name: 'Calcul prix distance', status: 'idle' },
        { id: 'del-4', name: 'Hook useDeliveryPricing OK', status: 'idle' },
      ],
    },
  ];

  const [sections, setSections] = useState<TestSection[]>(initialSections);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (id: string, update: Partial<TestResult>) => {
    setSections(prev =>
      prev.map(s => ({
        ...s,
        tests: s.tests.map(t => (t.id === id ? { ...t, ...update } : t)),
      }))
    );
  };

  const runTest = async (id: string, fn: () => Promise<string>): Promise<boolean> => {
    updateTest(id, { status: 'running', details: undefined, duration: undefined });
    const start = performance.now();
    try {
      const details = await fn();
      const duration = Math.round(performance.now() - start);
      console.log(`${LOG_PREFIX} ✅ ${id}: ${details} (${duration}ms)`);
      updateTest(id, { status: 'pass', details, duration });
      return true;
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      const msg = err?.message || String(err);
      console.error(`${LOG_PREFIX} ❌ ${id}: ${msg} (${duration}ms)`);
      updateTest(id, { status: 'fail', details: msg, duration });
      return false;
    }
  };

  // ─── GPS Tests ───
  const runGpsTests = async () => {
    // 1. checkPermissions
    await runTest('gps-1', async () => {
      const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
      const result = await nativeGeolocationService.checkPermissions();
      if (result.location === 'granted') return `location=${result.location}`;
      throw new Error(`location=${result.location} (expected granted)`);
    });

    // 2. getCurrentPosition < 15s
    let coords: { lat: number; lng: number } | null = null;
    await runTest('gps-2', async () => {
      const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
      const pos = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      });
      if (!pos.lat || !pos.lng) throw new Error('No coords');
      coords = { lat: pos.lat, lng: pos.lng };
      return `lat=${pos.lat.toFixed(4)}, lng=${pos.lng.toFixed(4)}, acc=${pos.accuracy?.toFixed(0)}m`;
    });

    // 3. Reset cache + retry
    await runTest('gps-3', async () => {
      const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
      // Reset internal permission cache if method exists
      if (typeof (nativeGeolocationService as any).resetPermissionCache === 'function') {
        (nativeGeolocationService as any).resetPermissionCache();
      }
      const pos = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 15000,
      });
      if (!pos.lat) throw new Error('No coords after reset');
      return `Retry OK: lat=${pos.lat.toFixed(4)}`;
    });

    // 4. Address enrichment
    await runTest('gps-4', async () => {
      if (!coords) throw new Error('No coords from previous test');
      // Try reverse geocoding via edge function
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: { lat: coords.lat, lng: coords.lng, action: 'reverse' },
      });
      if (error) throw error;
      const address = data?.results?.[0]?.formatted_address || data?.address || data?.display_name;
      if (!address) throw new Error('No address returned');
      return `Adresse: ${String(address).substring(0, 60)}`;
    });

    // 5. Platform detection
    await runTest('gps-5', async () => {
      const platform = getPlatformType();
      const os = getOS();
      const native = isMobileApp();
      const pwa = isPWA();
      return `platform=${platform}, os=${os}, native=${native}, pwa=${pwa}`;
    });
  };

  // ─── Taxi Tests ───
  const runTaxiTests = async () => {
    // 1. Google Maps loaded
    await runTest('taxi-1', async () => {
      // Try loading if not present
      if (!window.google?.maps?.Map) {
        const { googleMapsLoader } = await import('@/services/googleMapsLoader');
        await Promise.race([
          googleMapsLoader.load(),
          new Promise((_, rej) => setTimeout(() => rej(new Error('Maps load timeout 20s')), 20000)),
        ]);
      }
      if (typeof window.google?.maps?.Map !== 'function') throw new Error('google.maps.Map not a constructor');
      return 'google.maps.Map ✓';
    });

    // 2. Client position on map (reuse GPS)
    await runTest('taxi-2', async () => {
      const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
      const pos = await nativeGeolocationService.getCurrentPosition({ enableHighAccuracy: false, timeout: 10000 });
      if (!pos.lat) throw new Error('No position for map');
      return `pickupLocation: ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`;
    });

    // 3. Google Places autocomplete
    await runTest('taxi-3', async () => {
      const { data, error } = await supabase.functions.invoke('google-places-autocomplete', {
        body: { input: 'Gombe Kinshasa', language: 'fr' },
      });
      if (error) throw error;
      const count = data?.predictions?.length ?? 0;
      if (count === 0 && data?.shouldFallback) throw new Error('REQUEST_DENIED — check API key');
      if (count === 0) throw new Error('Zero predictions');
      return `${count} predictions (ex: ${data.predictions[0]?.description?.substring(0, 40)})`;
    });

    // 4. Vehicle types
    await runTest('taxi-4', async () => {
      const { data, error } = await supabase
        .from('service_configurations')
        .select('id, display_name, service_type')
        .eq('service_type', 'taxi')
        .eq('is_active', true);
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No taxi configs found');
      const names = data.map(v => v.display_name).join(', ');
      return `${data.length} types: ${names}`;
    });

    // 5. Dispatch ready
    await runTest('taxi-5', async () => {
      const mod = await import('@/hooks/useRideDispatch');
      if (typeof mod.useRideDispatch !== 'function') throw new Error('useRideDispatch not a function');
      return 'useRideDispatch importable ✓';
    });
  };

  // ─── Delivery Tests ───
  const runDeliveryTests = async () => {
    // 1. GPS prefilled
    await runTest('del-1', async () => {
      const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
      const pos = await nativeGeolocationService.getCurrentPosition({ enableHighAccuracy: false, timeout: 10000 });
      if (!pos.lat) throw new Error('No GPS for pickup');
      return `Pickup GPS: ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`;
    });

    // 2. Google Places destination
    await runTest('del-2', async () => {
      const { data, error } = await supabase.functions.invoke('google-places-autocomplete', {
        body: { input: 'Limete Kinshasa', language: 'fr' },
      });
      if (error) throw error;
      if (!data?.predictions?.length) throw new Error('No predictions for destination');
      return `${data.predictions.length} résultats destination`;
    });

    // 3. Price calculation
    await runTest('del-3', async () => {
      const result = calculateDeliveryPrice('flash', 5);
      if (!result || result.totalPrice <= 0) throw new Error(`Invalid price: ${result?.totalPrice}`);
      return `Flash 5km = ${result.totalPrice} ${result.currency} (source: ${result.source})`;
    });

    // 4. Hook integrity
    await runTest('del-4', async () => {
      if (typeof calculateDeliveryPrice !== 'function') throw new Error('calculateDeliveryPrice missing');
      if (typeof getServicePricing !== 'function') throw new Error('getServicePricing missing');
      const flash = getServicePricing('flash');
      return `Hook OK — flash base=${flash.basePrice}, source=${flash.source}`;
    });
  };

  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setSections(initialSections());
    console.log(`${LOG_PREFIX} ═══════════════════════════════════`);
    console.log(`${LOG_PREFIX} 🚀 Démarrage des 14 tests natifs`);
    console.log(`${LOG_PREFIX} ═══════════════════════════════════`);

    await runGpsTests();
    await runTaxiTests();
    await runDeliveryTests();

    console.log(`${LOG_PREFIX} ═══════════════════════════════════`);
    console.log(`${LOG_PREFIX} 🏁 Tests terminés`);
    setIsRunning(false);
  }, [calculateDeliveryPrice, getServicePricing]);

  // Score
  const allTests = sections.flatMap(s => s.tests);
  const passed = allTests.filter(t => t.status === 'pass').length;
  const failed = allTests.filter(t => t.status === 'fail').length;
  const total = allTests.length;
  const done = passed + failed;

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Smartphone className="h-5 w-5" /> Native Check
          </h1>
          <p className="text-sm text-muted-foreground">
            {done > 0 ? `${passed}/${total} tests passés` : '14 tests à exécuter'}
          </p>
        </div>
        <Button onClick={runAllTests} disabled={isRunning} size="sm">
          <RefreshCw className={`h-4 w-4 mr-1 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'En cours...' : 'Lancer'}
        </Button>
      </div>

      {/* Score bar */}
      {done > 0 && (
        <div className="mb-4 rounded-lg bg-muted p-3">
          <div className="flex justify-between text-sm font-medium mb-1">
            <span>{passed} ✅</span>
            <span>{failed} ❌</span>
          </div>
          <div className="h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(passed / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Sections */}
      {sections.map((section, si) => (
        <Card key={si} className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {section.icon} {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {section.tests.map(test => (
              <div
                key={test.id}
                className="flex items-start gap-2 text-sm border-b border-border/50 pb-2 last:border-0"
              >
                <span className="text-lg leading-none mt-0.5">{statusIcon(test.status)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{test.name}</p>
                  {test.details && (
                    <p className="text-xs text-muted-foreground break-all mt-0.5">{test.details}</p>
                  )}
                </div>
                {test.duration !== undefined && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {test.duration}ms
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Platform info */}
      <div className="text-xs text-muted-foreground text-center mt-4 space-y-0.5">
        <p>Platform: {getPlatformType()} | OS: {getOS()}</p>
        <p>Native: {String(isMobileApp())} | PWA: {String(isPWA())}</p>
        <p>UA: {navigator.userAgent.substring(0, 80)}...</p>
      </div>
    </div>
  );
};
