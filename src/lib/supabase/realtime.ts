import { supabase, isSupabaseConfigured, MENU_NAME_ALIASES } from './client.ts';
import { useMenuStore } from '../../stores/menuStore.ts';
import { useHistoryStore } from '../../stores/historyStore.ts';
import { useCashierStore } from '../../stores/cashierStore.ts';
import { logInfo, logError } from '../logger/logger.ts';

const POS_CHANNEL_NAME = 'tatie-pos-realtime';

// Singleton instance channel
let syncChannel: ReturnType<typeof supabase.channel> | null = null;
let isInitialized = false;

export interface MenuAvailabilityPayload {
  itemId: string;
  name: string;
  available: boolean;
  senderDeviceId?: string;
}

export interface OrderCreatedPayload {
  orderId: string;
  queueNo?: number;
  total?: number;
  senderDeviceId?: string;
}

// Generate device session ID unik untuk menandai asal perubahan
const DEVICE_SESSION_ID =
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `dev-${Math.random().toString(36).substring(2, 9)}`;

/**
 * Broadcast perubahan ketersediaan menu ke seluruh device yang sedang aktif secara instan (< 100ms)
 */
export async function broadcastMenuAvailability(
  itemId: string,
  name: string,
  available: boolean
): Promise<void> {
  if (!isSupabaseConfigured() || !syncChannel) return;

  try {
    await syncChannel.send({
      type: 'broadcast',
      event: 'MENU_AVAILABILITY_CHANGED',
      payload: {
        itemId,
        name,
        available,
        senderDeviceId: DEVICE_SESSION_ID,
      } as MenuAvailabilityPayload,
    });
    logInfo('realtimeSync:broadcast', `Menu availability broadcast sent for ${name} -> ${available}`);
  } catch (err) {
    logError('realtimeSync:broadcast_menu_err', err);
  }
}

/**
 * Broadcast pembuatan pesanan / transaksi baru ke seluruh device secara instan (< 100ms)
 */
export async function broadcastOrderCreated(
  orderId: string,
  queueNo?: number,
  total?: number
): Promise<void> {
  if (!isSupabaseConfigured() || !syncChannel) return;

  try {
    await syncChannel.send({
      type: 'broadcast',
      event: 'ORDER_CREATED',
      payload: {
        orderId,
        queueNo,
        total,
        senderDeviceId: DEVICE_SESSION_ID,
      } as OrderCreatedPayload,
    });
    logInfo('realtimeSync:broadcast', `Order created broadcast sent for order #${queueNo || 1}`);
  } catch (err) {
    logError('realtimeSync:broadcast_order_err', err);
  }
}

/**
 * Inisialisasi Sinkronisasi Real-Time Dua Arah Antar-Perangkat
 * Menghubungkan WebSocket Supabase Realtime (Broadcast + Postgres Changes)
 * dan auto-refresh saat window fokus / online
 */
export function initPosRealtimeSync(): () => void {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  if (isInitialized && syncChannel) {
    return () => {};
  }

  isInitialized = true;

  try {
    syncChannel = supabase.channel(POS_CHANNEL_NAME, {
      config: {
        broadcast: { ack: false, self: false },
      },
    });

    // 1. Dengar perubahan ketersediaan menu dari perangkat lain (Laptop / Tablet / HP)
    syncChannel.on(
      'broadcast',
      { event: 'MENU_AVAILABILITY_CHANGED' },
      ({ payload }: { payload: MenuAvailabilityPayload }) => {
        if (!payload || payload.senderDeviceId === DEVICE_SESSION_ID) return;

        const { itemId, name, available } = payload;
        logInfo('realtimeSync:receive', `Menerima update ketersediaan dari device lain: ${name} -> ${available}`);

        // Perbarui menuStore secara instan
        useMenuStore.setState((state) => {
          const normName = name ? name.trim().toLowerCase() : '';
          const alias = normName ? MENU_NAME_ALIASES[normName] : undefined;
          const updatedItems = state.items.map((it) => {
            const itNorm = it.name.trim().toLowerCase();
            if (
              it.id === itemId ||
              (normName && itNorm === normName) ||
              (alias && itNorm === alias.toLowerCase())
            ) {
              return { ...it, available };
            }
            return it;
          });

          // Simpan ke localStorage agar konsisten offline
          try {
            const raw = localStorage.getItem('tk_item_availability');
            const map = raw ? JSON.parse(raw) : {};
            if (itemId) map[itemId] = available;
            if (normName) map[normName] = available;
            if (alias) map[alias.toLowerCase()] = available;
            localStorage.setItem('tk_item_availability', JSON.stringify(map));
          } catch (err) {
            logError('realtimeSync:local_persist_err', err);
          }

          return {
            items: updatedItems,
            toastMessage: `${name} ${available ? 'tersedia lagi' : 'ditandai habis'} (sinkron otomatis)`,
          };
        });

        // Hilangkan toast setelah 2.5 detik
        setTimeout(() => {
          useMenuStore.getState().setToastMessage(null);
        }, 2500);
      }
    );

    // 2. Dengar transaksi pesanan baru dari perangkat lain
    syncChannel.on(
      'broadcast',
      { event: 'ORDER_CREATED' },
      ({ payload }: { payload: OrderCreatedPayload }) => {
        if (!payload || payload.senderDeviceId === DEVICE_SESSION_ID) return;

        logInfo('realtimeSync:receive', `Menerima transaksi baru dari device lain: Order #${payload.queueNo || ''}`);
        // Segera fetch data riwayat pesanan terbaru dari Supabase
        useHistoryStore.getState().fetchOrders().catch(() => {});
      }
    );

    // 3. Fallback Postgres Changes pada public.menu_items
    syncChannel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'menu_items' },
      (changePayload) => {
        logInfo('realtimeSync:postgres_menu', JSON.stringify(changePayload));
        useMenuStore.getState().fetchMenu().catch(() => {});
      }
    );

    // 4. Fallback Postgres Changes pada public.orders
    syncChannel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (changePayload) => {
        logInfo('realtimeSync:postgres_orders', JSON.stringify(changePayload));
        useHistoryStore.getState().fetchOrders().catch(() => {});
      }
    );

    syncChannel.subscribe((status) => {
      logInfo('realtimeSync:status', `Supabase Realtime Channel: ${status}`);
      if (status === 'SUBSCRIBED') {
        // Ambil data terbaru saat pertama kali terhubung
        useMenuStore.getState().fetchMenu().catch(() => {});
        useHistoryStore.getState().fetchOrders().catch(() => {});
        useCashierStore.getState().fetchCashiers().catch(() => {});
      }
    });

    return () => {
      if (syncChannel) {
        syncChannel.unsubscribe().catch(() => {});
        syncChannel = null;
      }
      isInitialized = false;
    };
  } catch (err) {
    logError('realtimeSync:init_exception', err);
    return () => {};
  }
}
