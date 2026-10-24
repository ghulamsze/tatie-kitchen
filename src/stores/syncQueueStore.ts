import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client.ts';
import { logError, logInfo } from '../lib/logger/logger.ts';
import { useHistoryStore } from './historyStore.ts';

export interface PendingOrderPayload {
  id: string;
  shop_id: string;
  cashier_id: string;
  device_id: string | null;
  table_no: string;
  cash_received_idr: number;
  items: Array<{ menu_item_id: string; qty: number }>;
}

export interface SyncQueueItem {
  id: string;
  payload: PendingOrderPayload;
  addedAt: string;
  retryCount: number;
}

interface SyncQueueState {
  queue: SyncQueueItem[];
  isSyncing: boolean;
  enqueue: (payload: PendingOrderPayload) => void;
  syncPendingOrders: () => Promise<{ synced: number; failed: number }>;
  clearQueue: () => void;
}

const STORAGE_KEY = 'tk_sync_queue';
const SYNC_RESET_KEY = 'tk_sync_queue_reset_20261024_v2';

function loadStoredQueue(): SyncQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    if (!localStorage.getItem(SYNC_RESET_KEY)) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(SYNC_RESET_KEY, 'true');
      return [];
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    logError('syncQueueStore:loadStoredQueue', err);
    return [];
  }
}

function persistQueue(queue: SyncQueueItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    logError('syncQueueStore:persistQueue', err);
  }
}

export const useSyncQueueStore = create<SyncQueueState>((set, get) => {
  const initialQueue = loadStoredQueue();

  // Otomatis jalankan sinkronisasi saat koneksi internet kembali online
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      logInfo('syncQueueStore', 'Koneksi kembali online. Memulai sinkronisasi pesanan antrian...');
      get().syncPendingOrders();
    });
  }

  return {
    queue: initialQueue,
    isSyncing: false,

    enqueue: (payload: PendingOrderPayload) => {
      set((state) => {
        // Cek jika ID order sudah ada di antrian agar tidak duplikat
        if (state.queue.some((item) => item.id === payload.id)) {
          return state;
        }

        const newItem: SyncQueueItem = {
          id: payload.id,
          payload,
          addedAt: new Date().toISOString(),
          retryCount: 0,
        };

        const updatedQueue = [...state.queue, newItem];
        persistQueue(updatedQueue);
        logInfo('syncQueueStore', `Order ${payload.id} dimasukkan ke sync queue (total antrian: ${updatedQueue.length})`);
        return { queue: updatedQueue };
      });

      // Segera coba sinkronisasi jika saat ini terhubung online
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        get().syncPendingOrders();
      }
    },

    syncPendingOrders: async () => {
      const { queue, isSyncing } = get();
      if (isSyncing || queue.length === 0 || !isSupabaseConfigured()) {
        return { synced: 0, failed: 0 };
      }

      set({ isSyncing: true });
      let syncedCount = 0;
      let failedCount = 0;
      const remainingQueue: SyncQueueItem[] = [];

      for (const item of queue) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (supabase.rpc as any)('create_order', {
            p_order: item.payload,
          });

          if (!error) {
            syncedCount += 1;
            logInfo('syncQueueStore', `Order ${item.id} berhasil disinkronkan ke Supabase via RPC!`);
          } else {
            // Coba fallback direct insert ke tabel orders dan order_items
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: insErr } = await (supabase.from('orders') as any).insert({
              id: item.payload.id,
              shop_id: item.payload.shop_id || '40f91c30-2e23-476b-bdd7-5e0605b1f812',
              cashier_id: item.payload.cashier_id || '1d83083c-9d75-4dec-9c1a-75be69bc1050',
              table_no: item.payload.table_no,
              total_idr: item.payload.cash_received_idr,
              cash_received_idr: item.payload.cash_received_idr,
              change_idr: 0,
              status: 'paid',
              queue_no: (item.payload as any).queue_no || 1,
              business_date: (item.payload as any).business_date || new Date().toISOString().slice(0, 10),
              payment_method: (item.payload as any).payment_method || 'Tunai',
            });

            if (!insErr) {
              if (item.payload.items && item.payload.items.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase.from('order_items') as any).insert(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  item.payload.items.map((it: any) => ({
                    order_id: item.payload.id,
                    name_snapshot: it.name_snapshot || 'Menu',
                    price_snapshot_idr: it.price_snapshot_idr || 0,
                    qty: it.qty,
                  }))
                );
              }
              syncedCount += 1;
              logInfo('syncQueueStore', `Order ${item.id} berhasil disinkronkan via direct insert!`);
            } else {
              logError(`syncQueueStore:syncOrder:${item.id}`, error);
              item.retryCount += 1;
              remainingQueue.push(item);
              failedCount += 1;
            }
          }
        } catch (err) {
          logError(`syncQueueStore:syncOrderException:${item.id}`, err);
          item.retryCount += 1;
          remainingQueue.push(item);
          failedCount += 1;
        }
      }

      persistQueue(remainingQueue);
      set({ queue: remainingQueue, isSyncing: false });

      if (syncedCount > 0) {
        useHistoryStore.getState().fetchOrders().catch(() => {});
      }

      return { synced: syncedCount, failed: failedCount };
    },

    clearQueue: () => {
      persistQueue([]);
      set({ queue: [] });
    },
  };
});
