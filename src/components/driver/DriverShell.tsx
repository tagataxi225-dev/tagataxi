import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Bell, Power, Car, Target, ChevronRight, Star,
  Shield, HelpCircle, LogOut, User, Phone, Mail,
  CreditCard, Globe, Moon, ArrowLeft, MapPin, Clock,
  Camera, Loader2, CheckCircle, AlertCircle, Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDriverStatus } from '@/hooks/useDriverStatus';
import { useDriverGeolocation } from '@/hooks/useDriverGeolocation';
import { supabase } from '@/integrations/supabase/client';
import { NotificationsPanel } from './modals/NotificationsPanel';
import { DriverSettingsPanel } from './settings/DriverSettingsPanel';
import DriverRideNotifications from './DriverRideNotifications';
import motoSvg from '@/assets/vehicle-icons/moto.svg';
import carSvg from '@/assets/vehicle-icons/car.svg';
import carConfortSvg from '@/assets/vehicle-icons/car-confort.svg';
import carPremiumSvg from '@/assets/vehicle-icons/car-premium.svg';

// ============================================================================
// Types
// ============================================================================

type Tab = 'home' | 'gains' | 'challenges' | 'subscription' | 'profile';

interface DriverShellProps {
  hasActiveRide: boolean;
  activeTab: Tab;
  currency: string;
  onTabChange: (tab: Tab) => void;
  gainsSlot?: React.ReactNode;
  challengesSlot?: React.ReactNode;
  subscriptionSlot?: React.ReactNode;
}

// ============================================================================
// Helpers
// ============================================================================

const toTitleCase = (s: string) =>
  s.split(' ').filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}` : `${m} min`;
}

function formatPrice(n: number): string {
  return n.toLocaleString('fr-FR');
}

// ============================================================================
// Sous-composants
// ============================================================================

function DriverLocationSync() {
  useDriverGeolocation({ autoSync: true });
  return null;
}

function VehicleIcon({ vehicleClass }: { vehicleClass: string }) {
  const cls = vehicleClass.toLowerCase();
  const src = cls === 'moto' ? motoSvg : cls === 'premium' || cls === 'vip' ? carPremiumSvg : cls === 'standard' || cls === 'confort' ? carConfortSvg : carSvg;
  return <img src={src} alt={cls} className="w-16 h-10 object-contain" />;
}

// ============================================================================
// Composant principal
// ============================================================================

export default function DriverShell({
  hasActiveRide, activeTab, currency,
  onTabChange,
  gainsSlot, challengesSlot, subscriptionSlot,
}: DriverShellProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { status, goOnline, goOffline } = useDriverStatus();

  // ── Profile depuis chauffeurs ──
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [photoUrl, setPhotoUrl]   = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [rating, setRating]       = useState(0);
  const [totalRides, setTotalRides] = useState(0);
  const [memberSince, setMemberSince] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState<string | null>(null);
  const [vehicleModel, setVehicleModel] = useState<string | null>(null);
  const [vehiclePlate, setVehiclePlate] = useState<string | null>(null);
  const [vehicleClass, setVehicleClass] = useState<string | null>(null);
  const [driverCity, setDriverCity] = useState('');

  // ── Partenaire actif depuis partner_drivers ──
  // undefined = loading, null = no partner, object = active partner
  const [partnerInfo, setPartnerInfo] = useState<
    { company_name: string; commission_rate: number } | null | undefined
  >(undefined);

  // ── Vrai compteur de courses ──
  const [realRideCount, setRealRideCount] = useState(0);

  // ── Code chauffeur depuis driver_codes ──
  const [driverCode, setDriverCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // ── Véhicule assigné depuis partner_taxi_vehicles ──
  const [partnerVehicle, setPartnerVehicle] = useState<{
    brand: string | null;
    model: string | null;
    license_plate: string | null;
    vehicle_class: string | null;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('chauffeurs')
      .select('display_name, profile_photo_url, rating_average, total_rides, vehicle_make, vehicle_model, vehicle_plate, vehicle_class, city')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const parts = data.display_name ? toTitleCase(data.display_name).split(' ') : [];
        setFirstName(parts[0] ?? user.email?.split('@')[0] ?? 'Chauffeur');
        setLastName(parts.slice(1).join(' ') || '');
        setPhotoUrl(data.profile_photo_url ?? null);
        setRating(data.rating_average ?? 0);
        setTotalRides(data.total_rides ?? 0);
        setVehicleBrand(data.vehicle_make ?? null);
        setVehicleModel(data.vehicle_model ?? null);
        setVehiclePlate(data.vehicle_plate ?? null);
        setVehicleClass(data.vehicle_class ?? null);
        setDriverCity(data.city ?? '');
      });
    if (user.created_at) {
      setMemberSince(
        new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      );
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('partner_taxi_vehicles')
      .select('brand, model, license_plate, vehicle_class')
      .eq('assigned_driver_id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setPartnerVehicle(data); });
  }, [user?.id]);

  // ── Code chauffeur actif ──
  useEffect(() => {
    if (!user) return;
    supabase
      .from('driver_codes')
      .select('code')
      .eq('driver_id', user.id)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.code) setDriverCode(data.code);
      });
  }, [user?.id]);

  const handleCopyCode = useCallback(async () => {
    if (!driverCode) return;
    try {
      await navigator.clipboard.writeText(driverCode);
      setCodeCopied(true);
      toast.success('Code copié !');
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      toast.error('Impossible de copier');
    }
  }, [driverCode]);

  // ── Partenaire actif (deux requêtes séparées pour éviter une jointure cassée) ──
  useEffect(() => {
    if (!user) return;
    supabase
      .from('partner_drivers')
      .select('commission_rate, partner_id')
      .eq('driver_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
      .then(async ({ data: pd }) => {
        if (!pd) {
          setPartnerInfo(null);
          return;
        }
        const { data: p } = await supabase
          .from('partenaires')
          .select('company_name')
          .eq('id', pd.partner_id)
          .single();
        setPartnerInfo({
          company_name: p?.company_name || 'Partenaire',
          commission_rate: pd.commission_rate || 2.5,
        });
      });
  }, [user]);

  // ── Compteur de courses réelles depuis transport_bookings ──
  useEffect(() => {
    if (!user) return;
    supabase
      .from('transport_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('driver_id', user.id)
      .eq('status', 'completed')
      .then(({ count }) => setRealRideCount(count ?? 0));
  }, [user?.id]);

  // ── Stats du jour depuis transport_bookings ──
  const [todayRides, setTodayRides]       = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);

  useEffect(() => {
    if (!user) return;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    supabase
      .from('transport_bookings')
      .select('actual_price, estimated_price')
      .eq('driver_id', user.id)
      .eq('status', 'completed')
      .gte('created_at', startOfDay.toISOString())
      .then(({ data }) => {
        if (!data) return;
        setTodayRides(data.length);
        setTodayEarnings(
          data.reduce((sum, b) => sum + (b.actual_price ?? b.estimated_price ?? 0), 0)
        );
      });
  }, [user?.id]);

  // ── Upload photo de profil ──
  const handlePhotoSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset input pour pouvoir re-sélectionner le même fichier
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop volumineuse (max 5 Mo)');
      return;
    }

    setUploadingPhoto(true);
    try {
      const path = `${user.id}/profile.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, {
          upsert: true,
          contentType: file.type || 'image/jpeg',
          cacheControl: '3600',
        });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path);
      // Cache-bust pour forcer le rechargement
      const publicUrl = `${publicData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('chauffeurs')
        .update({ profile_photo_url: publicUrl })
        .eq('user_id', user.id);
      if (updateError) throw updateError;

      setPhotoUrl(publicUrl);
      toast.success('Photo de profil mise à jour');
    } catch (err: any) {
      console.error('[Avatar upload]', err);
      toast.error(err?.message || "Impossible de mettre à jour la photo");
    } finally {
      setUploadingPhoto(false);
    }
  }, [user]);

  // ── Notifications non lues depuis push_notifications ──
  const [notifCount, setNotifCount] = useState(0);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ compte: false, preferences: true, aide: true });
  const toggleSection = (key: string) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (!user) return;

    // Chargement initial
    supabase
      .from('push_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_sent', false)
      .then(({ count }) => setNotifCount(count ?? 0));

    // Temps réel : nouvelles notifications + marquées comme lues
    const channel = supabase
      .channel(`shell-notifs-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'push_notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => setNotifCount(prev => prev + 1))
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'push_notifications',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        if ((payload.new as any).is_sent === true) {
          setNotifCount(prev => Math.max(0, prev - 1));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // ── Minutes en ligne : compteur local réinitialisé à chaque session ──
  const [onlineMinutes, setOnlineMinutes] = useState(0);
  const isOnline = status.isOnline;

  useEffect(() => {
    if (!isOnline) { setOnlineMinutes(0); return; }
    const interval = setInterval(() => setOnlineMinutes(prev => prev + 1), 60000);
    return () => clearInterval(interval);
  }, [isOnline]);

  // ── Toggle en ligne / hors ligne ──
  const handleToggleOnline = useCallback(async () => {
    if (isOnline) await goOffline();
    else await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => { goOnline(pos.coords.latitude, pos.coords.longitude); resolve(); },
        () => { goOnline(0, 0); resolve(); }
      );
    });
  }, [isOnline, goOnline, goOffline]);

  const greeting = useMemo(() => getGreeting(), []);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = '/driver/auth';
  }, []);

  const handleCityChange = useCallback(async (city: string) => {
    if (!user) return;
    setDriverCity(city);
    const { error } = await supabase
      .from('chauffeurs')
      .update({ city })
      .eq('user_id', user.id);
    if (error) {
      toast.error('Impossible de sauvegarder la ville');
    } else {
      toast.success(`Zone de service : ${city}`);
    }
  }, [user]);

  const handleProfileNav = useCallback((key: string) => {
    switch (key) {
      case 'personal':      navigate('/app/chauffeur/profil/edit'); break;
      case 'phone':         navigate('/app/chauffeur/profil/phone'); break;
      case 'email':         navigate('/app/chauffeur/profil/email'); break;
      case 'payments':      navigate('/app/chauffeur/profil/payments'); break;
      case 'activity':      navigate('/driver/activity-history'); break;
      case 'language':      navigate('/app/chauffeur/profil/langue'); break;
      case 'theme':         navigate('/app/chauffeur/profil/apparence'); break;
      case 'notifications': navigate('/app/chauffeur/profil/notifications'); break;
      case 'help':          navigate('/app/chauffeur/aide'); break;
      case 'legal':         navigate('/app/chauffeur/conditions'); break;
    }
  }, [navigate]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'home',         label: 'Courses',   icon: <Car size={20} /> },
    { id: 'gains',        label: 'Gains',     icon: <CreditCard size={20} /> },
    { id: 'challenges',   label: 'Défis',     icon: <Target size={20} /> },
    { id: 'subscription', label: 'Abo',       icon: <Shield size={20} /> },
    { id: 'profile',      label: 'Profil',    icon: <User size={20} /> },
  ];

  return (
    <>
    <DriverLocationSync />
    <DriverRideNotifications />
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}>

      {/* ── Header — masqué en course active ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100" style={{ paddingTop: 'env(safe-area-inset-top, 8px)', display: (activeTab === 'home' || activeTab === 'profile' || activeTab === 'gains' || activeTab === 'challenges' || activeTab === 'subscription' || hasActiveRide) ? 'none' : undefined }}>
        <div className="flex items-center gap-3 px-4 py-3">

          {/* Greeting */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">{greeting}</p>
            <p className="text-base font-bold text-gray-900 truncate">
              {[firstName, lastName].filter(Boolean).join(' ') || '…'}
            </p>
          </div>



          {/* Online toggle */}
          <button
            onClick={handleToggleOnline}
            className={`flex items-center gap-1.5 rounded-full px-3 py-2 transition-all active:scale-95 ${
              isOnline
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-gray-200 text-gray-600'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            <Power size={14} />
            <span className="text-xs font-bold">{isOnline ? 'En ligne' : 'Off'}</span>
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto pb-20">

        {/* ===== TAB: HOME ===== */}
        {activeTab === 'home' && (
          <div className="px-4 py-4 space-y-4">

            {/* Hero offline */}
            {!isOnline && (
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                  <Power size={28} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-white mb-1">Vous êtes hors ligne</h2>
                <p className="text-sm text-gray-400 mb-4">Passez en ligne pour recevoir des courses</p>
                <button
                  onClick={handleToggleOnline}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-bold text-base active:bg-emerald-600 transition-colors"
                  style={{ touchAction: 'manipulation' }}
                >
                  Passer en ligne
                </button>
              </div>
            )}

            {/* Indicateur en ligne */}
            {isOnline && !hasActiveRide && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-3 mb-1">
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-50" />
                  </div>
                  <span className="text-sm font-semibold text-emerald-700">En ligne · En attente de courses</span>
                </div>
                <p className="text-xs text-gray-400 ml-6">En ligne depuis {formatDuration(onlineMinutes)}</p>
              </div>
            )}

            {/* Stats du jour */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Statistiques du jour</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">{todayRides}</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Courses</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">{formatPrice(todayEarnings)}</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{currency}</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">{formatDuration(onlineMinutes)}</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">En ligne</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB: GAINS ===== */}
        {activeTab === 'gains' && gainsSlot}

        {/* ===== TAB: CHALLENGES ===== */}
        {activeTab === 'challenges' && challengesSlot}

        {/* ===== TAB: SUBSCRIPTION ===== */}
        {activeTab === 'subscription' && subscriptionSlot}

        {/* ===== TAB: PROFILE ===== */}
        {activeTab === 'profile' && (
          <>
          {/* Cloche fixe sur l'onglet profil */}

          <div style={{ padding: '16px', paddingBottom: '100px', fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif' }}>

            {/* ── Hero card ── */}
            <div style={{ background: 'linear-gradient(135deg,#1C1C1E 0%,#2C2C2E 100%)', borderRadius: 24, padding: '20px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
              {/* Subtle pattern */}
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(232,53,59,0.12)' }} />
              <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(232,53,59,0.07)' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'linear-gradient(135deg,#E8353B,#FF6B6B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#fff', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.15)' }}>
                    {photoUrl ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (firstName || '?').charAt(0).toUpperCase()}
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}
                    style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: '#E8353B', border: '2.5px solid #1C1C1E', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation' }}>
                    {uploadingPhoto ? <Loader2 style={{ width: 12, height: 12, color: '#fff' }} /> : <Camera style={{ width: 12, height: 12, color: '#fff' }} />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={handlePhotoSelected} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: -0.5 }}>{firstName} {lastName}</p>
                  {driverCode && (
                    <button type="button" onClick={handleCopyCode}
                      style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '3px 10px', border: 'none', cursor: 'pointer', touchAction: 'manipulation' }}>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 800, color: '#aaa', letterSpacing: 1 }}>{driverCode}</span>
                      {codeCopied ? <CheckCircle style={{ width: 10, height: 10, color: '#30D158' }} /> : <Copy style={{ width: 10, height: 10, color: '#888' }} />}
                    </button>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,159,10,0.15)', borderRadius: 20, padding: '2px 8px' }}>
                      <Star style={{ width: 11, height: 11, fill: '#FF9F0A', color: '#FF9F0A' }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#FF9F0A' }}>{rating.toFixed(1)}</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#636366' }}>{realRideCount} courses</span>
                    <span style={{ fontSize: 11, color: '#636366' }}>· Membre depuis {memberSince}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Véhicule + types éligibles ── */}
            {(partnerVehicle || vehicleBrand) && (() => {
              const vClass = (partnerVehicle?.vehicle_class || vehicleClass || 'eco').toLowerCase();
              const ALL_TYPES = [
                { key: 'moto',     label: 'Moto',     color: '#FF9F0A' },
                { key: 'eco',      label: 'Eco',      color: '#30D158' },
                { key: 'standard', label: 'Confort',  color: '#0A84FF' },
                { key: 'confort',  label: 'Confort',  color: '#BF5AF2' },
                { key: 'premium',  label: 'Premium',  color: '#FF9F0A' },
              ];
              const ORDER = ['moto', 'eco', 'standard', 'confort', 'premium'];
              const myIdx = ORDER.indexOf(vClass);
              const eligible = ALL_TYPES.filter(t => {
                if (t.key === 'moto') return vClass === 'moto';
                const tIdx = ORDER.indexOf(t.key);
                // Un chauffeur peut faire les courses de son type ET des types inférieurs
                // (pas de type supérieur sans autorisation partenaire)
                return tIdx >= 1 && tIdx <= myIdx && t.key !== 'moto';
              });
              const brand = partnerVehicle ? [partnerVehicle.brand, partnerVehicle.model].filter(Boolean).join(' ') : [vehicleBrand, vehicleModel].filter(Boolean).join(' ');
              const plate = partnerVehicle?.license_plate || vehiclePlate || '—';
              const year = partnerVehicle?.year;
              const color = partnerVehicle?.color;
              return (
                <div style={{ background: '#fff', borderRadius: 20, padding: '16px', marginBottom: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>Mon véhicule</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <VehicleIcon vehicleClass={vClass} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 16, fontWeight: 800, color: '#1C1C1E', margin: '0 0 2px' }}>{brand || '—'}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ fontSize: 12, color: '#636366', background: '#F2F2F7', borderRadius: 8, padding: '2px 8px', fontWeight: 600 }}>{plate}</span>
                        {color && <span style={{ fontSize: 12, color: '#636366', background: '#F2F2F7', borderRadius: 8, padding: '2px 8px', fontWeight: 600 }}>{color}</span>}
                        {year && <span style={{ fontSize: 12, color: '#636366', background: '#F2F2F7', borderRadius: 8, padding: '2px 8px', fontWeight: 600 }}>{year}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Types éligibles */}
                  <div style={{ borderTop: '1px solid #F2F2F7', paddingTop: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#8E8E93', margin: '0 0 8px' }}>Types de courses autorisés</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {eligible.map(t => (
                        <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${t.color}15`, borderRadius: 20, padding: '5px 12px', border: `1.5px solid ${t.color}30` }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: t.color }}>{t.label}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 10, color: '#C7C7CC', margin: '7px 0 0' }}>Éligibilité basée sur la configuration de votre partenaire</p>
                  </div>
                </div>
              );
            })()}

            {/* ── Partenaire ── */}
            {partnerInfo && (
              <div style={{ background: '#F0FDF4', borderRadius: 20, padding: '14px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, border: '1.5px solid #BBF7D0' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle style={{ width: 20, height: 20, color: '#16A34A' }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#15803D', margin: 0 }}>{partnerInfo.company_name}</p>
                  <p style={{ fontSize: 12, color: '#16A34A', margin: 0 }}>Partenaire actif · {partnerInfo.commission_rate}% commission</p>
                </div>
              </div>
            )}
            {partnerInfo === null && (
              <div style={{ background: '#FFFBEB', borderRadius: 20, padding: '14px 16px', marginBottom: 14, border: '1.5px solid #FDE68A' }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#92400E', margin: '0 0 8px' }}>Aucun partenaire</p>
                <button onClick={() => navigate('/driver/find-partner')}
                  style={{ width: '100%', padding: '10px', borderRadius: 14, background: '#E8353B', border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', touchAction: 'manipulation' }}>
                  Rejoindre une flotte
                </button>
              </div>
            )}

            {/* ── Zone de service ── */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '16px', marginBottom: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>Zone de service</p>
              <p style={{ fontSize: 12, color: '#8E8E93', margin: '0 0 8px' }}>Ville dans laquelle vous acceptez les courses</p>
              <div style={{ position: 'relative' }}>
                <MapPin style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#8E8E93', pointerEvents: 'none' }} />
                <select value={driverCity} onChange={e => handleCityChange(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 34px', borderRadius: 14, border: '1.5px solid #E5E5EA', background: '#F7F7F9', fontSize: 14, fontWeight: 600, color: '#1C1C1E', appearance: 'none', outline: 'none' }}>
                  <option value="">Sélectionner une ville...</option>
                  <option value="Kinshasa">Kinshasa</option>
                  <option value="Lubumbashi">Lubumbashi</option>
                  <option value="Kolwezi">Kolwezi</option>
                  <option value="Abidjan">Abidjan</option>
                </select>
              </div>
            </div>

            {/* ── Sections accordion ── */}
            {[
              { title: 'Compte', key: 'compte', items: [
                { icon: User,       label: 'Informations personnelles', key: 'personal' },
                { icon: Phone,      label: 'Numéro de téléphone',       key: 'phone' },
                { icon: Mail,       label: 'Email',                     key: 'email' },
                { icon: CreditCard, label: 'Paiements',                 key: 'payments' },
                { icon: Clock,      label: "Historique d'activité",     key: 'activity' },
              ]},
              { title: 'Préférences', key: 'preferences', items: [
                { icon: Moon,        label: 'Apparence',     key: 'theme' },
                { icon: Globe,       label: 'Langue',        key: 'language' },
                { icon: Bell,        label: 'Notifications', key: 'notifications' },
              ]},
              { title: 'Aide', key: 'aide', items: [
                { icon: HelpCircle, label: "Centre d'aide",              key: 'help' },
                { icon: Shield,     label: 'Conditions & confidentialité', key: 'legal' },
              ]},
            ].map(section => (
              <div key={section.key} style={{ background: '#fff', borderRadius: 18, marginBottom: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <button type="button" onClick={() => toggleSection(section.key)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', touchAction: 'manipulation' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1C1C1E' }}>{section.title}</span>
                  <ChevronRight style={{ width: 15, height: 15, color: '#C7C7CC', transform: collapsed[section.key] ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.2s ease' }} />
                </button>
                {!collapsed[section.key] && (
                  <div style={{ borderTop: '1px solid #F2F2F7' }}>
                    {section.items.map((item, idx) => (
                      <button key={item.key} type="button" onClick={() => handleProfileNav(item.key)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', touchAction: 'manipulation', borderTop: idx > 0 ? '1px solid #F7F7F9' : 'none' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: '#F2F2F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <item.icon style={{ width: 15, height: 15, color: '#636366' }} />
                        </div>
                        <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#1C1C1E', textAlign: 'left' }}>{item.label}</span>
                        <ChevronRight style={{ width: 13, height: 13, color: '#C7C7CC' }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* ── Déconnexion ── */}
            <button type="button" onClick={handleLogout}
              style={{ width: '100%', padding: '15px', borderRadius: 18, background: '#FFF1F0', border: '1.5px solid #FFD5D5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', touchAction: 'manipulation', marginBottom: 8 }}>
              <LogOut style={{ width: 16, height: 16, color: '#E8353B' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#E8353B' }}>Se déconnecter</span>
            </button>

            <p style={{ textAlign: 'center', fontSize: 10, color: '#C7C7CC', paddingBottom: 8 }}>TAGA Driver · v1.1.5</p>
          </div>
          </>
        )}
      </div>

      {/* ── Bottom Nav ── */}
      {!hasActiveRide && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', display: hasActiveRide ? 'none' : undefined }}>
          <div className="flex items-center justify-around py-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                  activeTab === tab.id ? 'text-red-500' : 'text-gray-400'
                }`}
                style={{ touchAction: 'manipulation' }}
              >
                {tab.icon}
                <span className="text-[10px] font-semibold">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="w-4 h-0.5 rounded-full bg-red-500 mt-0.5" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* ── Overlay notifications ── */}
    {showNotifications && (
      <div className="fixed inset-0 z-[250] bg-background overflow-y-auto">
        <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3" style={{ paddingTop: 'env(safe-area-inset-top, 12px)' }}>
          <button type="button" onClick={() => setShowNotifications(false)} aria-label="Fermer les notifications" className="p-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <span className="font-semibold text-base">Notifications</span>
        </div>
        <div className="px-4 py-4">
          <NotificationsPanel />
        </div>
      </div>
    )}

    {/* ── Overlay paramètres ── */}
    {showSettings && (
      <div className="fixed inset-0 z-[250] bg-background overflow-y-auto">
        <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3" style={{ paddingTop: 'env(safe-area-inset-top, 12px)' }}>
          <button type="button" onClick={() => setShowSettings(false)} aria-label="Fermer les paramètres" className="p-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <span className="font-semibold text-base">Paramètres</span>
        </div>
        <div className="px-4 py-4">
          <DriverSettingsPanel onClose={() => setShowSettings(false)} />
        </div>
      </div>
    )}
    </>
  );
}
