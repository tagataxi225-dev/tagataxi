/**
 * Queue de synchronisation pour opérations offline
 * Utilise IndexedDB pour persister les actions en attente
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface PendingBooking {
  id: string;
  type: 'transport' | 'delivery';
  data: any;
  createdAt: number;
  retryCount: number;
}

interface PendingPayment {
  id: string;
  amount: number;
  currency: string;
  data: any;
  createdAt: number;
  retryCount: number;
}

interface PendingMessage {
  id: string;
  conversationId: string;
  message: string;
  createdAt: number;
  retryCount: number;
}

interface TembeaDB extends DBSchema {
  pending_bookings: {
    key: string;
    value: PendingBooking;
    indexes: { 'by-date': number };
  };
  pending_payments: {
    key: string;
    value: PendingPayment;
    indexes: { 'by-date': number };
  };
  pending_messages: {
    key: string;
    value: PendingMessage;
    indexes: { 'by-conversation': string };
  };
}

const DB_NAME = 'kwenda-offline';
const DB_VERSION = 1;
const MAX_RETRY = 3;
const RETRY_DELAY_BASE = 1000; // ms

let dbInstance: IDBPDatabase<TembeaDB> | null = null;

/**
 * Initialise la base de données IndexedDB
 */
export const initOfflineDB = async (): Promise<IDBPDatabase<TembeaDB>> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<TembeaDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store pour bookings en attente
      if (!db.objectStoreNames.contains('pending_bookings')) {
        const bookingStore = db.createObjectStore('pending_bookings', { keyPath: 'id' });
        bookingStore.createIndex('by-date', 'createdAt');
      }

      // Store pour paiements en attente
      if (!db.objectStoreNames.contains('pending_payments')) {
        const paymentStore = db.createObjectStore('pending_payments', { keyPath: 'id' });
        paymentStore.createIndex('by-date', 'createdAt');
      }

      // Store pour messages en attente
      if (!db.objectStoreNames.contains('pending_messages')) {
        const messageStore = db.createObjectStore('pending_messages', { keyPath: 'id' });
        messageStore.createIndex('by-conversation', 'conversationId');
      }
    }
  });

  return dbInstance;
};

/**
 * Ajoute un booking à la queue offline
 */
export const queueOfflineBooking = async (type: 'transport' | 'delivery', data: any): Promise<string> => {
  const db = await initOfflineDB();
  const id = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const booking: PendingBooking = {
    id,
    type,
    data,
    createdAt: Date.now(),
    retryCount: 0
  };

  await db.add('pending_bookings', booking);
  console.log('📥 Booking queued offline:', id);
  return id;
};

/**
 * Ajoute un paiement à la queue offline
 */
export const queueOfflinePayment = async (amount: number, currency: string, data: any): Promise<string> => {
  const db = await initOfflineDB();
  const id = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const payment: PendingPayment = {
    id,
    amount,
    currency,
    data,
    createdAt: Date.now(),
    retryCount: 0
  };

  await db.add('pending_payments', payment);
  console.log('💰 Payment queued offline:', id);
  return id;
};

/**
 * Ajoute un message à la queue offline
 */
export const queueOfflineMessage = async (conversationId: string, message: string): Promise<string> => {
  const db = await initOfflineDB();
  const id = `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const msg: PendingMessage = {
    id,
    conversationId,
    message,
    createdAt: Date.now(),
    retryCount: 0
  };

  await db.add('pending_messages', msg);
  console.log('💬 Message queued offline:', id);
  return id;
};

/**
 * Récupère tous les éléments en attente
 */
export const getPendingItems = async () => {
  const db = await initOfflineDB();
  const [bookings, payments, messages] = await Promise.all([
    db.getAll('pending_bookings'),
    db.getAll('pending_payments'),
    db.getAll('pending_messages')
  ]);

  return { bookings, payments, messages };
};

/**
 * Synchronise la queue avec le serveur
 */
export const syncPendingQueue = async (
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> => {
  if (!navigator.onLine) {
    console.log('🔌 Offline - sync postponed');
    return { success: 0, failed: 0 };
  }

  const db = await initOfflineDB();
  const { bookings, payments, messages } = await getPendingItems();
  const total = bookings.length + payments.length + messages.length;
  let current = 0;
  let success = 0;
  let failed = 0;

  console.log(`🔄 Syncing ${total} pending items...`);

  // Sync bookings
  for (const booking of bookings) {
    current++;
    onProgress?.(current, total);

    try {
      await syncBooking(booking);
      await db.delete('pending_bookings', booking.id);
      success++;
      console.log('✅ Booking synced:', booking.id);
    } catch (error) {
      console.error('❌ Booking sync failed:', booking.id, error);
      
      if (booking.retryCount < MAX_RETRY) {
        await db.put('pending_bookings', { ...booking, retryCount: booking.retryCount + 1 });
      } else {
        failed++;
        await db.delete('pending_bookings', booking.id);
      }
    }

    await delay(RETRY_DELAY_BASE);
  }

  // Sync payments
  for (const payment of payments) {
    current++;
    onProgress?.(current, total);

    try {
      await syncPayment(payment);
      await db.delete('pending_payments', payment.id);
      success++;
      console.log('✅ Payment synced:', payment.id);
    } catch (error) {
      console.error('❌ Payment sync failed:', payment.id, error);
      
      if (payment.retryCount < MAX_RETRY) {
        await db.put('pending_payments', { ...payment, retryCount: payment.retryCount + 1 });
      } else {
        failed++;
        await db.delete('pending_payments', payment.id);
      }
    }

    await delay(RETRY_DELAY_BASE);
  }

  // Sync messages
  for (const message of messages) {
    current++;
    onProgress?.(current, total);

    try {
      await syncMessage(message);
      await db.delete('pending_messages', message.id);
      success++;
      console.log('✅ Message synced:', message.id);
    } catch (error) {
      console.error('❌ Message sync failed:', message.id, error);
      
      if (message.retryCount < MAX_RETRY) {
        await db.put('pending_messages', { ...message, retryCount: message.retryCount + 1 });
      } else {
        failed++;
        await db.delete('pending_messages', message.id);
      }
    }

    await delay(RETRY_DELAY_BASE);
  }

  console.log(`✅ Sync complete: ${success} success, ${failed} failed`);
  return { success, failed };
};

/**
 * Fonctions de synchronisation (à implémenter avec Supabase)
 */
const syncBooking = async (booking: PendingBooking): Promise<void> => {
  // TODO: Implémenter avec supabase.from('transport_bookings' ou 'delivery_orders').insert()
  console.log('Syncing booking:', booking);
};

const syncPayment = async (payment: PendingPayment): Promise<void> => {
  // TODO: Implémenter avec Edge Function wallet-topup
  console.log('Syncing payment:', payment);
};

const syncMessage = async (message: PendingMessage): Promise<void> => {
  // TODO: Implémenter avec supabase.from('messages').insert()
  console.log('Syncing message:', message);
};

/**
 * Nettoie les éléments trop anciens (>7 jours)
 */
export const cleanOldPendingItems = async (): Promise<number> => {
  const db = await initOfflineDB();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let deleted = 0;

  const { bookings, payments, messages } = await getPendingItems();

  for (const booking of bookings) {
    if (booking.createdAt < sevenDaysAgo) {
      await db.delete('pending_bookings', booking.id);
      deleted++;
    }
  }

  for (const payment of payments) {
    if (payment.createdAt < sevenDaysAgo) {
      await db.delete('pending_payments', payment.id);
      deleted++;
    }
  }

  for (const message of messages) {
    if (message.createdAt < sevenDaysAgo) {
      await db.delete('pending_messages', message.id);
      deleted++;
    }
  }

  console.log(`🗑️ Cleaned ${deleted} old pending items`);
  return deleted;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Obtient le nombre d'éléments en attente
 */
export const getPendingCount = async (): Promise<number> => {
  const { bookings, payments, messages } = await getPendingItems();
  return bookings.length + payments.length + messages.length;
};
