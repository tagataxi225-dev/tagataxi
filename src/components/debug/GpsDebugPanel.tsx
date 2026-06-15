/**
 * 🔴 GPS Debug Panel — visible uniquement sur Native + DEV
 */
import { useState, useEffect } from 'react';

interface DebugLog {
  time: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

let _isNative = false;
let _platform = 'web';
try {
  const { Capacitor } = require('@capacitor/core');
  _isNative = Capacitor.isNativePlatform();
  _platform = Capacitor.getPlatform();
} catch {}

export default function GpsDebugPanel() {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [visible, setVisible] = useState(false);

  const addLog = (message: string, type: DebugLog['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev.slice(-15), { time, message, type }]);
  };

  const runDiagnostic = async () => {
    setLogs([]);
    addLog(`Platform: ${_platform} | Native: ${_isNative}`);

    if (!_isNative) {
      addLog('⚠️ Pas en mode natif — Capacitor GPS non disponible', 'error');
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false, timeout: 5000, maximumAge: 60000
          });
        });
        addLog(`✅ Browser GPS: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} (±${Math.round(pos.coords.accuracy)}m)`, 'success');
      } catch (e: any) {
        addLog(`❌ Browser GPS: ${e.message} (code: ${e.code})`, 'error');
      }
      return;
    }

    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      
      addLog('🔍 checkPermissions()...');
      try {
        const perm = await Geolocation.checkPermissions();
        addLog(`Permission: location=${perm.location}`, perm.location === 'granted' ? 'success' : 'error');
      } catch (permErr: any) {
        addLog(`❌ checkPermissions: ${permErr.message || permErr}`, 'error');
      }

      addLog('🔍 requestPermissions()...');
      try {
        const reqResult = await Geolocation.requestPermissions();
        addLog(`Request result: location=${reqResult.location}`, reqResult.location === 'granted' ? 'success' : 'error');
      } catch (reqErr: any) {
        addLog(`❌ requestPermissions: ${reqErr.message || reqErr}`, 'error');
      }

      addLog('🔍 getCurrentPosition(low accuracy)...');
      try {
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
        addLog(`✅ OK: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} (±${Math.round(pos.coords.accuracy)}m)`, 'success');
      } catch (posErr: any) {
        addLog(`❌ getCurrentPosition: ${posErr.message || posErr}`, 'error');
      }

      addLog('🔍 getCurrentPosition(HIGH accuracy)...');
      try {
        const pos2 = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
        addLog(`✅ HIGH: ${pos2.coords.latitude.toFixed(5)}, ${pos2.coords.longitude.toFixed(5)} (±${Math.round(pos2.coords.accuracy)}m)`, 'success');
      } catch (posErr2: any) {
        addLog(`❌ HIGH accuracy: ${posErr2.message || posErr2}`, 'error');
      }
    } catch (importErr: any) {
      addLog(`❌ Import @capacitor/geolocation failed: ${importErr.message}`, 'error');
    }
  };

  useEffect(() => {
    const shouldShow = import.meta.env.DEV && _isNative;
    const urlDebug = new URLSearchParams(window.location.search).get('gpsDebug') === '1';
    setVisible(shouldShow || urlDebug);
    if (shouldShow || urlDebug) runDiagnostic();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-auto">
      <div 
        className="bg-red-600 text-white px-3 py-1 flex items-center justify-between cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="text-xs font-bold">🔴 GPS DEBUG</span>
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); runDiagnostic(); }}
            className="text-xs bg-white/20 px-2 py-0.5 rounded"
          >
            Retry
          </button>
          <span className="text-xs">{collapsed ? '▼' : '▲'}</span>
        </div>
      </div>
      
      {!collapsed && (
        <div className="bg-black/95 text-white max-h-[40vh] overflow-y-auto p-2 space-y-0.5">
          {logs.length === 0 && <p className="text-xs text-gray-400">Running diagnostic...</p>}
          {logs.map((log, i) => (
            <div key={i} className={`text-[10px] font-mono leading-tight ${
              log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-gray-300'
            }`}>
              <span className="text-gray-500">{log.time}</span> {log.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
