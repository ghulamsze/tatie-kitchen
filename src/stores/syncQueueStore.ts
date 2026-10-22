import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client.ts';
import { logError, logInfo } from '../lib/logger/logger.ts';

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

function loadStoredQueue(): SyncQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
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

          if (error) {
            logError(`syncQueueStore:syncOrder:${item.id}`, error);
            item.retryCount += 1;
            remainingQueue.push(item);
            failedCount += 1;
          } else {
            syncedCount += 1;
            logInfo('syncQueueStore', `Order ${item.id} berhasil disinkronkan ke Supabase database!`);
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

      return { synced: syncedCount, failed: failedCount };
    },

    clearQueue: () => {
      persistQueue([]);
      set({ queue: [] });
    },
  };
});
