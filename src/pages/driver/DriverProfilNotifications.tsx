import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface NotifPrefs {
  newRides: boolean;
  rideUpdates: boolean;
  promotions: boolean;
}

const DEFAULTS: NotifPrefs = {
  newRides: true,
  rideUpdates: true,
  promotions: false,
};

const STORAGE_KEY = 'kwenda_notif_prefs';

const DriverProfilNotifications = () => {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULTS);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setPrefs({ ...DEFAULTS, ...parsed });
    } catch {
      // ignore corrupt value
    }
  }, []);

  const update = (key: keyof NotifPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const items: { key: keyof NotifPrefs; label: string }[] = [
    { key: 'newRides', label: 'Nouvelles courses' },
    { key: 'rideUpdates', label: 'Mises à jour de course' },
    { key: 'promotions', label: 'Promotions' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Retour"
          className="p-2 rounded-full hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-base">Notifications</span>
      </div>

      <div className="flex-1 px-4 py-6">
        <div className="bg-white rounded-xl border overflow-hidden">
          {items.map((item, idx) => (
            <div
              key={item.key}
              className={`flex items-center justify-between px-4 py-4 ${
                idx > 0 ? 'border-t border-gray-100' : ''
              }`}
            >
              <Label htmlFor={item.key} className="text-sm text-gray-900 cursor-pointer">
                {item.label}
              </Label>
              <Switch
                id={item.key}
                checked={prefs[item.key]}
                onCheckedChange={(v) => update(item.key, v)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DriverProfilNotifications;
