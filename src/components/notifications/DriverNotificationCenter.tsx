/**
 * 🚗 Centre de Notifications Unifié pour Chauffeurs
 * Feed clean, regroupé par date, avec section paramètres en bas.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, Bell, CheckCircle, Car, DollarSign,
  MessageCircle, Info, MapPin, X, Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnifiedNotifications } from '@/hooks/useUnifiedNotifications';
import { useDriverDispatch } from '@/hooks/useDriverDispatch';
import { CancellationDialog } from '@/components/shared/CancellationDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DriverNotificationCenterProps {
  className?: string;
}

type NotifKind = 'course' | 'payment' | 'message' | 'system';

interface NotifPrefs {
  newRides: boolean;
  rideUpdates: boolean;
  promotions: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  newRides: true,
  rideUpdates: true,
  promotions: false,
};

const PREFS_KEY = 'kwenda_notif_prefs';

const getNotifKind = (typeOrTitle?: string): NotifKind => {
  const t = (typeOrTitle || '').toLowerCase();
  if (
    t.includes('ride') || t.includes('course') || t.includes('transport') ||
    t.includes('delivery') || t.includes('livraison') || t.includes('marketplace')
  ) return 'course';
  if (t.includes('payment') || t.includes('paiement') || t.includes('wallet') || t.includes('payout')) return 'payment';
  if (t.includes('message') || t.includes('chat')) return 'message';
  return 'system';
};

const KIND_STYLES: Record<NotifKind, { bg: string; text: string; Icon: React.ComponentType<{ className?: string }> }> = {
  course:  { bg: 'bg-red-50',   text: 'text-red-600',   Icon: Car },
  payment: { bg: 'bg-green-50', text: 'text-green-600', Icon: DollarSign },
  message: { bg: 'bg-blue-50',  text: 'text-blue-600',  Icon: MessageCircle },
  system:  { bg: 'bg-gray-100', text: 'text-gray-600',  Icon: Info },
};

const groupLabelFor = (iso: string): string => {
  const d = new Date(iso); d.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  if (d.getTime() === today.getTime()) return "Aujourd'hui";
  if (d.getTime() === yesterday.getTime()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
};

const formatTime = (iso: string): string => {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

export const DriverNotificationCenter: React.FC<DriverNotificationCenterProps> = ({ className }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});

  // Préférences locales
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  useEffect(() => {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return;
    try { setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) }); } catch { /* ignore */ }
  }, []);
  const updatePref = (key: keyof NotifPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  };

  // Notifications système via hook unifié
  const {
    notifications: systemNotifications,
    unreadCount: systemUnreadCount,
    markAsRead,
    markAllAsRead,
  } = useUnifiedNotifications('driver');

  // Alertes de livraison via hook unifié
  const {
    pendingNotifications,
    loading: deliveryLoading,
    acceptOrder,
    rejectOrder,
  } = useDriverDispatch();
  const deliveryAlerts = pendingNotifications.filter(n => n.type === 'delivery' || n.type === 'marketplace');

  // Compte à rebours pour les alertes
  useEffect(() => {
    const interval = setInterval(() => {
      const next: Record<string, number> = {};
      deliveryAlerts.forEach(alert => {
        if (alert.expires_at) {
          const expiresAt = new Date(alert.expires_at).getTime();
          const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
          next[alert.id] = remaining;
        }
      });
      setTimeRemaining(next);
    }, 1000);
    return () => clearInterval(interval);
  }, [deliveryAlerts]);

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRejectRide = (id: string) => {
    setSelectedBookingId(id);
    setShowCancelDialog(true);
  };

  const handleCancelBooking = async (reason: string) => {
    if (!selectedBookingId || !user) return;
    try {
      const { error } = await supabase
        .from('transport_bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: reason,
          cancellation_type: 'driver',
        })
        .eq('id', selectedBookingId);
      if (error) throw error;

      await supabase
        .from('cancellation_history')
        .insert({
          reference_id: selectedBookingId,
          reference_type: 'transport',
          cancelled_by: user.id,
          cancellation_type: 'driver',
          reason,
          status_at_cancellation: 'pending',
        });

      toast.success('Course refusée');
    } catch (err) {
      console.error('Error cancelling booking:', err);
      toast.error('Erreur lors du refus de la course');
    } finally {
      setShowCancelDialog(false);
      setSelectedBookingId(null);
    }
  };

  const totalUnread = systemUnreadCount + deliveryAlerts.length;

  // Grouper les notifications système par date
  const groupedSystem = useMemo(() => {
    const groups = new Map<string, typeof systemNotifications>();
    for (const n of systemNotifications) {
      const label = groupLabelFor(n.created_at);
      const arr = groups.get(label) ?? [];
      arr.push(n);
      groups.set(label, arr);
    }
    return Array.from(groups.entries());
  }, [systemNotifications]);

  return (
    <>
      <div className={cn('flex flex-col bg-gray-50 dark:bg-background min-h-dvh', className)}>
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-background border-b border-gray-100 dark:border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Retour"
              className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center"
              style={{ touchAction: 'manipulation' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-base text-foreground">Notifications</h1>
          </div>
          {totalUnread > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              className="inline-flex items-center min-h-[44px] px-3 text-sm font-semibold text-red-600 active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation' }}
            >
              Tout lire
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pb-6">
          {/* Empty state */}
          {deliveryAlerts.length === 0 && systemNotifications.length === 0 && (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-muted flex items-center justify-center">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Aucune notification</p>
              <p className="text-sm text-gray-400 mt-1">Les nouvelles courses apparaîtront ici</p>
            </div>
          )}

          {/* Delivery alerts (always at top, urgent) */}
          {deliveryAlerts.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-gray-400 uppercase px-4 mb-2 mt-4">
                À traiter maintenant
              </h3>
              {deliveryAlerts.map((alert) => {
                const remaining = timeRemaining[alert.id] || 0;
                const isExpired = remaining === 0;
                const style = KIND_STYLES.course;
                const Icon = style.Icon;
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      'bg-white dark:bg-card rounded-2xl shadow-sm mx-4 mb-2 p-4 flex flex-col gap-3 border-l-2',
                      isExpired ? 'border-red-300 bg-red-50/30' : 'border-red-500 bg-red-50/30',
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', style.bg)}>
                        <Package className={cn('h-5 w-5', style.text)} aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm text-foreground line-clamp-2">
                            {isExpired ? 'Course expirée' : alert.title}
                          </p>
                          {!isExpired && (
                            <span className="text-xs font-mono font-semibold text-red-600 shrink-0">
                              {formatTimeRemaining(remaining)}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 space-y-0.5">
                          <div className="flex items-start gap-1.5 text-xs text-gray-500 dark:text-muted-foreground">
                            <MapPin className="w-3 h-3 text-green-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{alert.data?.pickup_location || alert.location}</span>
                          </div>
                          <div className="flex items-start gap-1.5 text-xs text-gray-500 dark:text-muted-foreground">
                            <MapPin className="w-3 h-3 text-red-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{alert.data?.delivery_location || alert.data?.destination || 'Destination'}</span>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-foreground mt-1.5">
                          {alert.estimatedPrice?.toLocaleString()} FC
                          <span className="text-xs font-normal text-gray-400 ml-2">
                            · {alert.distance?.toFixed(1) || '0.0'} km
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); acceptOrder(alert); }}
                        disabled={deliveryLoading || isExpired}
                        className="bg-green-600 hover:bg-green-700 text-white h-11 rounded-xl"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {isExpired ? 'Expirée' : 'Accepter'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); handleRejectRide(alert.id); }}
                        disabled={isExpired}
                        className="h-11 rounded-xl"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Ignorer
                      </Button>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* System notifications grouped by date */}
          {groupedSystem.map(([label, items]) => (
            <section key={label}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase px-4 mb-2 mt-4">
                {label}
              </h3>
              {items.map((notif) => {
                const kind = getNotifKind(notif.type || notif.title);
                const style = KIND_STYLES[kind];
                const Icon = style.Icon;
                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => !notif.is_read && markAsRead(notif.id)}
                    className={cn(
                      'w-[calc(100%-2rem)] mx-4 mb-2 p-4 flex gap-3 text-left bg-white dark:bg-card rounded-2xl shadow-sm transition-colors',
                      !notif.is_read && 'border-l-2 border-red-500 bg-red-50/30 dark:bg-red-950/10',
                    )}
                    style={{ touchAction: 'manipulation' }}
                  >
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', style.bg)}>
                      <Icon className={cn('h-5 w-5', style.text)} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">
                        {notif.title}
                      </p>
                      {notif.message && (
                        <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                      )}
                      <p className="text-gray-400 text-xs mt-1">
                        {formatTime(notif.created_at)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </section>
          ))}

          {/* Settings section at bottom */}
          <section className="mt-8 mx-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
              Paramètres
            </h3>
            <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border divide-y divide-gray-100 dark:divide-border">
              {([
                { key: 'newRides' as const, label: 'Nouvelles courses', subtitle: 'Recevoir une alerte pour chaque demande' },
                { key: 'rideUpdates' as const, label: 'Mises à jour de course', subtitle: 'Changements de statut et messages client' },
                { key: 'promotions' as const, label: 'Promotions', subtitle: 'Bonus et offres spéciales chauffeur' },
              ]).map(({ key, label, subtitle }) => (
                <div key={key} className="flex items-center justify-between gap-4 px-4 py-4">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor={key} className="text-sm font-semibold text-foreground cursor-pointer block">
                      {label}
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5">
                      {subtitle}
                    </p>
                  </div>
                  <Switch
                    id={key}
                    checked={prefs[key]}
                    onCheckedChange={(v) => updatePref(key, v)}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <CancellationDialog
        isOpen={showCancelDialog}
        onClose={() => { setShowCancelDialog(false); setSelectedBookingId(null); }}
        onConfirm={handleCancelBooking}
        userType="driver"
        bookingType="transport"
      />
    </>
  );
};

export default DriverNotificationCenter;
