/**
 * 🔔 Service de Notifications Chauffeurs
 * 3 channels Supabase Realtime (sans filter=) + filtrage client par driverId
 * + polling de secours toutes les 15s sur les livraisons assignées.
 */

import { supabase } from '@/integrations/supabase/client';
import { LocalNotifications } from '@capacitor/local-notifications';
import { driverHaptics } from '@/utils/driverHaptics';
import { notificationSoundService } from '@/services/notificationSound';

type NotificationCallback = (notification: DriverNotification) => void;

type StatusCallback = (
  orderId: string,
  newStatus: string,
  table: 'transport_bookings' | 'delivery_orders'
) => void;

type CancelCallback = (data: { orderId: string; type: string }) => void;

interface DriverNotification {
  id: string;
  type: 'taxi' | 'delivery' | 'marketplace' | 'delivery_assignment';
  orderId: string;
  title: string;
  message: string;
  data: any;
  timestamp: number;
}

class DriverNotificationService {
  private channels: any[] = [];
  private callbacks: NotificationCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  private cancelCallbacks: CancelCallback[] = [];
  private pollingInterval: NodeJS.Timeout | null = null;
  private isActive = false;
  private processedIds = new Set<string>();
  private currentDriverId: string | null = null;

  /**
   * Démarrer le service
   */
  async start(driverId: string): Promise<void> {
    if (this.isActive) {
      console.log('🔔 Notification service already active');
      return;
    }
    this.isActive = true;
    this.currentDriverId = driverId;
    console.log('🔔 Starting notification service for driver:', driverId);

    // 1️⃣ transport_bookings — UPDATE
    const transportChannel = supabase
      .channel('driver-transport')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'transport_bookings' },
        (payload) => this.handleTransportUpdate(payload, driverId)
      )
      .subscribe();
    this.channels.push(transportChannel);

    // 2️⃣ delivery_orders — UPDATE
    const deliveryChannel = supabase
      .channel('driver-delivery')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'delivery_orders' },
        (payload) => this.handleDeliveryUpdate(payload, driverId)
      )
      .subscribe();
    this.channels.push(deliveryChannel);

    // 3️⃣ marketplace_delivery_assignments — UPDATE
    const marketplaceChannel = supabase
      .channel('driver-marketplace')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'marketplace_delivery_assignments' },
        (payload) => this.handleMarketplaceUpdate(payload, driverId)
      )
      .subscribe();
    this.channels.push(marketplaceChannel);

    // 4️⃣ Polling toutes les 15s (filet de secours)
    this.pollingInterval = setInterval(() => {
      this.pollPendingOrders(driverId);
    }, 15000);

    await this.requestNotificationPermissions();

    window.addEventListener('offer-submitted', (e: any) => {
      const id = e.detail?.bookingId;
      if (id) this.processedIds.add('transport-' + id);
    });

    // Force poll immédiatement après fin de course
    window.addEventListener('search-nearby-rides', () => {
      if (this.isActive) this.pollPendingOrders();
    });
  }

  /**
   * Arrêter le service
   */
  async stop(): Promise<void> {
    this.isActive = false;
    this.currentDriverId = null;
    for (const channel of this.channels) {
      await supabase.removeChannel(channel);
    }
    this.channels = [];
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    console.log('🔕 Notification service stopped');
  }

  // ────────────────────────── Subscriptions ──────────────────────────

  subscribe(cb: NotificationCallback): () => void {
    this.callbacks.push(cb);
    return () => {
      this.callbacks = this.callbacks.filter(c => c !== cb);
    };
  }

  subscribeToStatusChanges(cb: StatusCallback): () => void {
    this.statusCallbacks.push(cb);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(c => c !== cb);
    };
  }

  subscribeToCancel(cb: CancelCallback): () => void {
    this.cancelCallbacks.push(cb);
    return () => {
      this.cancelCallbacks = this.cancelCallbacks.filter(c => c !== cb);
    };
  }

  /** Alias rétro-compatible — utilisé par useDriverDispatch */
  subscribeToCancellation(cb: CancelCallback): () => void {
    return this.subscribeToCancel(cb);
  }

  // ────────────────────────── Handlers realtime ──────────────────────────

  private handleTransportUpdate(payload: any, driverId: string): void {
    const order = payload?.new;
    if (!order?.id) return;
    // Filtrage client : ignorer les commandes des autres chauffeurs
    if (order.driver_id !== driverId) return;

    if (order.status === 'driver_assigned') {
      const key = `transport-${order.id}`;
      if (this.processedIds.has(key)) {
        // Contre-offre déjà soumise → juste statusChange
        this.emitStatusChange(order.id, 'accepted', 'transport_bookings');
        return;
      }
      this.processedIds.add(key);
      // Course classique → émettre notification pour que le chauffeur puisse accepter
      this.emitNotification({
        id: key,
        type: 'taxi',
        orderId: order.id,
        title: '🚗 Nouvelle course !',
        message: `${order.pickup_location || ''} → ${order.destination || ''}`,
        data: order,
        timestamp: Date.now(),
      });
      return;
    }
    if (order.status === 'cancelled') {
      this.emitCancel({ orderId: order.id, type: 'taxi' });
      return;
    }
    // Pour 'accepted': fermer popup bidding + ouvrir sheet
    if (order.status === 'accepted') {
      window.dispatchEvent(new CustomEvent('ride-accepted', { detail: { bookingId: order.id } }));
    }
    this.emitStatusChange(order.id, order.status, 'transport_bookings');
  }

  private handleDeliveryUpdate(payload: any, driverId: string): void {
    const order = payload?.new;
    if (!order?.id) return;
    if (order.driver_id !== driverId) return;

    if (order.status === 'driver_assigned') {
      this.emitNotification({
        id: `delivery-${order.id}`,
        type: 'delivery',
        orderId: order.id,
        title: '📦 Nouvelle livraison !',
        message: `${order.pickup_location} → ${order.delivery_location}`,
        data: order,
        timestamp: Date.now(),
      });
      return;
    }
    if (order.status === 'cancelled') {
      this.emitCancel({ orderId: order.id, type: 'delivery' });
      return;
    }
    this.emitStatusChange(order.id, order.status, 'delivery_orders');
  }

  private handleMarketplaceUpdate(payload: any, driverId: string): void {
    const assignment = payload?.new;
    if (!assignment?.id) return;
    if (assignment.driver_id !== driverId) return;

    // Marketplace n'a pas de cycle de statut détaillé → simple notification
    this.emitNotification({
      id: `marketplace-${assignment.id}`,
      type: 'marketplace',
      orderId: assignment.order_id ?? assignment.id,
      title: '🛍️ Livraison marketplace !',
      message: 'Nouvelle livraison assignée',
      data: assignment,
      timestamp: Date.now(),
    });
  }

  // ────────────────────────── Polling ──────────────────────────

  /**
   * Filet de secours : récupère les livraisons assignées au chauffeur que
   * le realtime aurait pu manquer.
   */
  private async pollPendingOrders(driverId: string): Promise<void> {
    try {
      const { data: deliveries } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('driver_id', driverId)
        .eq('status', 'driver_assigned');

      if (!deliveries || deliveries.length === 0) return;

      for (const delivery of deliveries) {
        if (this.processedIds.has(delivery.id)) continue;
        this.processedIds.add(delivery.id);
        this.emitNotification({
          id: `delivery-assignment-${delivery.id}`,
          type: 'delivery_assignment',
          orderId: delivery.id,
          title: '📦 Livraison assignée',
          message: `${delivery.pickup_location} → ${delivery.delivery_location}`,
          data: delivery,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('❌ Error polling pending orders:', error);
    }
  }

  // ────────────────────────── Émetteurs ──────────────────────────

  private emitNotification(notification: DriverNotification): void {
    // 🔊 Son en PREMIER — avant les callbacks React pour réduire la latence perçue
    const soundMap: Record<string, any> = {
      taxi: 'driverAssigned',
      delivery: 'deliveryPicked',
      delivery_assignment: 'deliveryPicked',
      marketplace: 'newOrder',
    };
    const soundType = soundMap[notification.type] || 'driverAssigned';
    notificationSoundService.playNotificationSound(soundType);

    // Callbacks React
    this.callbacks.forEach(cb => {
      try { cb(notification); } catch (e) { console.error('❌ Notification callback error:', e); }
    });

    // 📱 Notification native (Capacitor)
    this.sendNativeNotification(notification);

    // 📳 Haptic
    driverHaptics.onNewRide();

    // 🌐 Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: `driver-${notification.id}`,
        requireInteraction: true,
      });
    }
  }

  private emitStatusChange(
    orderId: string,
    newStatus: string,
    table: 'transport_bookings' | 'delivery_orders'
  ): void {
    console.log('🔄 Status change:', { orderId, newStatus, table });
    this.statusCallbacks.forEach(cb => {
      try { cb(orderId, newStatus, table); } catch (e) { console.error('Status cb error:', e); }
    });
  }

  private emitCancel(data: { orderId: string; type: string }): void {
    console.log('🛑 Cancellation:', data);
    this.cancelCallbacks.forEach(cb => {
      try { cb(data); } catch (e) { console.error('Cancel cb error:', e); }
    });
  }

  // ────────────────────────── Notifications natives ──────────────────────────

  private async sendNativeNotification(notification: DriverNotification): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: notification.title,
          body: notification.message,
          sound: 'default',
          extra: notification.data,
        }],
      });
    } catch (error) {
      console.log('Native notification not available:', error);
    }
  }

  private async requestNotificationPermissions(): Promise<void> {
    try {
      const result = await LocalNotifications.requestPermissions();
      console.log('📱 Notification permissions:', result);
    } catch (error) {
      console.log('Notification permissions not available:', error);
    }
  }
}

export const driverNotificationService = new DriverNotificationService();
