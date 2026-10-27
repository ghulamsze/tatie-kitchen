import React, { useState } from 'react';
import { useCartStore } from '../../stores/cartStore.ts';
import { useCashierStore } from '../../stores/cashierStore.ts';
import { formatRupiah, getShopTodayDateStr } from '../../lib/format/formatters.ts';
import { Button } from '../../design/components/Button.tsx';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client.ts';
import { Order, OrderItem } from '../../lib/supabase/types.ts';
import { useHistoryStore } from '../../stores/historyStore.ts';

export interface PaymentScreenProps {
  onSuccess: () => void;
  onCancel: () => void;
}

import { logError } from '../../lib/logger/logger.ts';
import { useSyncQueueStore } from '../../stores/syncQueueStore.ts';
import { useShopStore } from '../../stores/shopStore.ts';

import { getQuickCashOptions } from './quickCash.ts';
import { playPaymentSound } from '../../lib/sound/sound.ts';
import { generateUUID } from '../../lib/uuid.ts';
import { triggerHapticFeedback } from '../../lib/device/haptics.ts';

export type PaymentMethod = 'tunai' | 'qris' | 'transfer';

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ onSuccess, onCancel }) => {
  const { lines, tableNo, setTableNo, cashReceived, setCashReceived, calculateTotal, clearCart, setLastOrder } = useCartStore();
  const { activeCashier } = useCashierStore();
  const { shop } = useShopStore();
  const [isQrisZoomed, setIsQrisZoomed] = useState(false);

  const total = calculateTotal();
  // Default meja selalu '..' dengan warna abu-abu
  const [tableInput, setTableInput] = useState<string>(
    tableNo && tableNo !== '..' && tableNo !== '...' && tableNo !== 'x' ? tableNo : '..'
  );
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const rejectTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerReject = () => {
    setIsRejecting(true);
    triggerHapticFeedback([40, 60, 40]);
    if (rejectTimeoutRef.current) clearTimeout(rejectTimeoutRef.current);
    rejectTimeoutRef.current = setTimeout(() => {
      setIsRejecting(false);
    }, 450);
  };

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [isManualCash, setIsManualCash] = useState<boolean>(false);
  const [manualCashInput, setManualCashInput] = useState<string>(cashReceived ? String(cashReceived) : '');
  // Default: uang pas (total)
  const [selectedQuickCash, setSelectedQuickCash] = useState<number>(cashReceived || total);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Meja wajib diinput sebelum pembayaran dapat diproses
  const isTableSet = tableInput !== '..' && tableInput !== '...' && tableInput !== 'x' && tableInput.trim().length > 0;

  // Status input manual aktif jika sedang difokuskan atau sudah diisi
  const isManualActive = isManualCash || Boolean(manualCashInput && manualCashInput.trim().length > 0);

  // Hitung uang tunai efektif yang diterima
  const effectiveCash = paymentMethod !== 'tunai'
    ? total
    : (isManualActive ? (parseInt(manualCashInput, 10) || 0) : selectedQuickCash);

  const change = Math.max(0, effectiveCash - total);
  const isCashSufficient = effectiveCash >= total;

  // Opsi cepat uang diterima dihitung secara dinamis
  const quickCashOptions = getQuickCashOptions(total);

  // Auto-confirm nomor meja saat digit diketik, maksimal 2 digit dan maksimal meja 30
  const handleKeypadPress = (val: string | number) => {
    if (val === 'Hapus') {
      if (tableInput.length > 1 && tableInput !== '..' && tableInput !== '...' && tableInput !== 'x') {
        const next = tableInput.slice(0, -1);
        setTableInput(next);
        setTableNo(next);
      } else {
        setTableInput('..');
        setTableNo('..');
      }
      return;
    }

    const digit = String(val);
    const isPlaceholder = tableInput === '..' || tableInput === '...' || tableInput === 'x';
    const candidateStr = isPlaceholder ? digit : `${tableInput}${digit}`;

    // Nomor meja maksimal 2 digit
    if (candidateStr.length > 2) {
      triggerReject();
      return;
    }

    const candidateNum = parseInt(candidateStr, 10);
    // Maksimal nomor meja adalah 30: blokir angka 0 tunggal atau nilai 31+ dengan animasi menolak merah (tanpa notif)
    if (isNaN(candidateNum) || candidateNum < 1 || candidateNum > 30) {
      triggerReject();
      return;
    }

    setTableInput(candidateStr);
    setTableNo(candidateStr);
  };


  const handleSelectCash = (amt: number) => {
    setIsManualCash(false);
    setManualCashInput('');
    setSelectedQuickCash(amt);
    setCashReceived(amt);
  };

  const handleManualCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsManualCash(true);
    const val = e.target.value.replace(/\D/g, '');
    setManualCashInput(val);
    const num = parseInt(val, 10) || 0;
    setCashReceived(num);
  };

  const handleCompletePayment = async () => {
    if (!isTableSet) {
      setErrorMessage('Silakan masukkan nomor meja terlebih dahulu.');
      return;
    }

    const finalTableNo = tableInput;
    setTableNo(finalTableNo);

    if (paymentMethod === 'tunai' && !isCashSufficient) {
      setErrorMessage('Uang yang diterima kurang dari total pembayaran.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const orderId = generateUUID();
      const isRealUuid = (val?: string | null): boolean =>
        Boolean(
          val &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val) &&
            !val.startsWith('00000000-0000-0000-0000-00000000000')
        );

      const cashierId = isRealUuid(activeCashier?.id)
        ? activeCashier!.id
        : '1d83083c-9d75-4dec-9c1a-75be69bc1050';
      const shopId = isRealUuid(activeCashier?.shop_id)
        ? activeCashier!.shop_id
        : isRealUuid(shop?.id)
        ? shop.id
        : '40f91c30-2e23-476b-bdd7-5e0605b1f812';

      const existingOrders = useHistoryStore.getState().orders;
      const todayDateStr = getShopTodayDateStr();
      const maxLocalQueue = existingOrders
        .filter((o) => o.order.business_date === todayDateStr || o.order.created_at.startsWith(todayDateStr))
        .reduce((max, o) => Math.max(max, o.order.queue_no || 0), 0);
      const nextQueueNo = maxLocalQueue + 1;

      const normalizedPaymentMethod =
        paymentMethod === 'qris'
          ? 'QRIS'
          : paymentMethod === 'transfer'
          ? 'Transfer Bank'
          : 'Tunai';

      let recordedOrder: Order;
      let recordedItems: OrderItem[];

      const orderPayload = {
        id: orderId,
        shop_id: shopId,
        cashier_id: cashierId,
        device_id: null,
        table_no: finalTableNo,
        cash_received_idr: effectiveCash,
        queue_no: nextQueueNo,
        business_date: todayDateStr,
        payment_method: normalizedPaymentMethod,
        items: lines.map((l) => ({
          menu_item_id: l.item.id,
          name_snapshot: l.item.name,
          price_snapshot_idr: l.item.price_idr,
          qty: l.qty,
        })),
      };

      if (isSupabaseConfigured()) {
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

        if (!isOnline) {
          // Jika offline, langsung masukkan ke antrian sync lokal tanpa jeda
          useSyncQueueStore.getState().enqueue(orderPayload);
        } else {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rpcPromise = (supabase.rpc as any)('create_order', {
              p_order: orderPayload,
            });
            const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), 8000)
            );

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (Promise.race([rpcPromise, timeoutPromise]) as Promise<any>);

            if (!error && data) {
              recordedOrder = {
                ...(data as Order),
                payment_method: normalizedPaymentMethod,
              };
              recordedItems = lines.map((l) => ({
                id: generateUUID(),
                order_id: recordedOrder.id,
                menu_item_id: l.item.id,
                name_snapshot: l.item.name,
                price_snapshot_idr: l.item.price_idr,
                qty: l.qty,
              }));

              setLastOrder(recordedOrder, recordedItems);
              useHistoryStore.getState().addOrder(recordedOrder, recordedItems);
              clearCart();
              playPaymentSound();
              onSuccess();
              return;
            } else {
              // Jika RPC gagal, coba fallback direct insert ke tabel orders dan order_items
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: insertedOrder, error: insErr } = await (supabase.from('orders') as any)
                  .insert({
                    id: orderId,
                    shop_id: shopId,
                    cashier_id: cashierId,
                    table_no: finalTableNo,
                    total_idr: total,
                    cash_received_idr: effectiveCash,
                    change_idr: change,
                    status: 'paid',
                    queue_no: nextQueueNo,
                    business_date: todayDateStr,
                    payment_method: normalizedPaymentMethod,
                  })
                  .select()
                  .single();

                if (!insErr && insertedOrder) {
                  recordedOrder = {
                    ...(insertedOrder as Order),
                    payment_method: normalizedPaymentMethod,
                  };
                  recordedItems = lines.map((l) => ({
                    id: generateUUID(),
                    order_id: recordedOrder.id,
                    menu_item_id: l.item.id,
                    name_snapshot: l.item.name,
                    price_snapshot_idr: l.item.price_idr,
                    qty: l.qty,
                  }));

                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  await (supabase.from('order_items') as any).insert(
                    recordedItems.map((it) => ({
                      order_id: recordedOrder.id,
                      name_snapshot: it.name_snapshot,
                      price_snapshot_idr: it.price_snapshot_idr,
                      qty: it.qty,
                    }))
                  );

                  setLastOrder(recordedOrder, recordedItems);
                  useHistoryStore.getState().addOrder(recordedOrder, recordedItems);
                  clearCart();
                  playPaymentSound();
                  onSuccess();
                  return;
                }
              } catch (directErr) {
                logError('PaymentScreen:direct_insert_fallback_error', directErr);
              }

              if (error) {
                logError('PaymentScreen:create_order_rpc_error', error);
              }
              useSyncQueueStore.getState().enqueue(orderPayload);
            }
          } catch (err) {
            logError('PaymentScreen:create_order_timeout_or_network', err);
            useSyncQueueStore.getState().enqueue(orderPayload);
          }
        }
      }

      // Fallback pencatatan transaksi lokal dengan penghitung antrian harian (reset 00:00 WITA)
      recordedOrder = {
        id: orderId,
        shop_id: shopId,
        cashier_id: cashierId,
        device_id: null,
        table_no: finalTableNo,
        total_idr: total,
        cash_received_idr: effectiveCash,
        change_idr: change,
        status: 'paid',
        queue_no: nextQueueNo,
        business_date: todayDateStr,
        payment_method: normalizedPaymentMethod,
        created_at: new Date().toISOString(),
      };

      recordedItems = lines.map((l) => ({
        id: generateUUID(),
        order_id: orderId,
        menu_item_id: l.item.id,
        name_snapshot: l.item.name,
        price_snapshot_idr: l.item.price_idr,
        qty: l.qty,
      }));

      setLastOrder(recordedOrder, recordedItems);
      useHistoryStore.getState().addOrder(recordedOrder, recordedItems);
      clearCart();
      playPaymentSound();
      onSuccess();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Terjadi kesalahan transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="scr"
      style={{
        width: '1024px',
        height: '640px',
        display: 'flex',
        gap: '16px',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Panel Kiri: Keypad Meja dengan Tombol Kembali di Kiri & Teks Nomor Meja di Kanannya */}
      <div className="g-acrylic tk-table-keypad-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Button variant="flat" size="md" onClick={onCancel} style={{ height: '40px', minWidth: '92px', padding: '0 16px' }}>
            Kembali
          </Button>
          <h3 style={{ margin: 0, fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)', fontWeight: 800 }}>
            Nomor meja
          </h3>
        </div>

        {/* Default meja selalu '..' dengan warna abu-abu, animasi menolak merah jika > 30 */}
        <div
          className={`tk-table-display ${isRejecting ? 'rejecting' : ''}`}
          style={{
            color: isRejecting
              ? 'var(--danger)'
              : (tableInput === '..' || tableInput === '...' || tableInput === 'x')
                ? 'var(--ink-3)'
                : 'var(--ink)',
            userSelect: 'none',
            transition: 'color 0.15s ease',
          }}
        >
          {tableInput}
        </div>

        <div className={`tk-keypad-grid ${isRejecting ? 'rejecting' : ''}`}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleKeypadPress(key)}
            >
              {key}
            </button>
          ))}
          {/* Baris Bawah: Tombol Hapus (Ikon Saja di Kiri), Angka 0 (Tengah), Placeholder Kosong (Kanan) */}
          <button
            type="button"
            onClick={() => handleKeypadPress('Hapus')}
            aria-label="Hapus"
            title="Hapus"
            style={{ display: 'grid', placeItems: 'center' }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => handleKeypadPress(0)}
          >
            0
          </button>
          <div style={{ height: '52px' }} aria-hidden="true" />
        </div>
      </div>

      {/* Panel Kanan: Metode Pembayaran (Tunai, QRIS, Transfer Bank) & Kembalian */}
      <div className="g-acrylic tk-payment-panel">
        {/* Selector 3 Metode Pembayaran */}
        <div style={{ display: 'flex', gap: '8px', flex: 'none' }}>
          <button
            type="button"
            className={`tk-chip ${paymentMethod === 'tunai' ? 'active lime' : ''}`}
            onClick={() => setPaymentMethod('tunai')}
          >
            Pembayaran tunai
          </button>
          <button
            type="button"
            className={`tk-chip ${paymentMethod === 'qris' ? 'active lime' : ''}`}
            onClick={() => {
              setPaymentMethod('qris');
              setIsManualCash(false);
              setErrorMessage('');
            }}
          >
            QRIS
          </button>
          <button
            type="button"
            className={`tk-chip ${paymentMethod === 'transfer' ? 'active lime' : ''}`}
            onClick={() => {
              setPaymentMethod('transfer');
              setIsManualCash(false);
              setErrorMessage('');
            }}
          >
            Transfer bank
          </button>
        </div>

        <div>
          <span style={{ color: 'var(--ink-2)', fontSize: 'var(--t-xs)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Total tagihan
          </span>
          <div style={{ fontSize: 'var(--t-2xl)', lineHeight: 'var(--l-2xl)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)', marginTop: '2px' }}>
            {formatRupiah(total)}
          </div>
        </div>

        {/* Konten Berdasarkan Metode Pembayaran */}
        {paymentMethod === 'tunai' ? (
          <>
            {/* Pilihan Cepat Uang Tunai */}
            <div className="tk-quick-cash-grid">
              {quickCashOptions.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  className={!isManualActive && selectedQuickCash === opt.amount ? 'selected' : ''}
                  onClick={() => handleSelectCash(opt.amount)}
                  style={{
                    height: '52px',
                    fontSize: '15px',
                    fontWeight: 700,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Kolom Input Nominal Manual */}
            <input
              type="text"
              inputMode="numeric"
              className="tk-input"
              placeholder="Input manual uang diterima..."
              value={manualCashInput}
              onFocus={() => {
                setIsManualCash(true);
              }}
              onClick={() => {
                setIsManualCash(true);
              }}
              onChange={handleManualCashChange}
              style={{
                height: '52px',
                padding: '0 16px',
                fontSize: '15px',
                fontWeight: 600,
                borderRadius: 'var(--r-md)',
                borderColor: isManualActive ? 'var(--ring)' : 'var(--ctl-line)',
                boxShadow: isManualActive ? '0 0 0 2px color-mix(in srgb, var(--ring) 35%, transparent)' : 'none',
                boxSizing: 'border-box',
                width: '100%',
              }}
            />

            {/* Kolom Kembalian */}
            <div className="tk-field" style={{ height: '52px', padding: '0 16px', boxSizing: 'border-box' }}>
              <span style={{ fontSize: 'var(--t-sm)', color: 'var(--ink-2)', fontWeight: 600 }}>Kembalian</span>
              <b style={{ fontSize: 'var(--t-xl)', lineHeight: 'var(--l-xl)', color: isCashSufficient ? 'var(--accent-ink)' : 'var(--danger)', fontWeight: 800 }}>
                {formatRupiah(change)}
              </b>
            </div>
          </>
        ) : paymentMethod === 'qris' ? (
          <div className="tk-qris-glass-card">
            <div
              className="tk-qris-img-glass"
              onClick={() => setIsQrisZoomed(true)}
              title="Ketuk untuk memperbesar QRIS"
            >
              <img
                src={shop.qris_path || '/assets/images/qris-clean.png'}
                alt="QRIS Toko"
                style={{
                  maxHeight: '148px',
                  width: 'auto',
                  objectFit: 'contain',
                  borderRadius: '6px',
                  display: 'block',
                }}
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <b style={{ fontSize: 'var(--t-sm)', color: 'var(--ink)', display: 'block', fontWeight: 800 }}>
                {shop.name || 'TATIS CAFE DAN RESTO'}
              </b>
              <span style={{ fontSize: '11px', color: 'var(--ink-2)', fontWeight: 600 }}>
                Ketuk gambar untuk memperbesar QRIS
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '12px',
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--ctl-line)',
            }}
          >
            <b style={{ fontSize: 'var(--t-md)', color: 'var(--ink)' }}>Rekening Transfer Bank:</b>
            <div
              style={{
                background: 'var(--ctl)',
                padding: '14px 18px',
                borderRadius: 'var(--r-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                border: '1px solid var(--ctl-line)',
              }}
            >
              <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-2)', fontWeight: 600 }}>
                {shop.bank_name}
              </span>
              <b style={{ fontSize: 'var(--t-xl)', letterSpacing: '0.06em', color: 'var(--accent-ink)' }}>
                {shop.bank_account}
              </b>
              <span style={{ fontSize: 'var(--t-sm)', color: 'var(--ink-1)', fontWeight: 700 }}>
                a.n. {shop.bank_account_holder}
              </span>
            </div>
          </div>
        )}

        {paymentMethod === 'tunai' && !isCashSufficient && (
          <span style={{ color: 'var(--danger)', fontSize: 'var(--t-sm)', fontWeight: 700, textAlign: 'center' }}>
            Uang yang diterima kurang dari total
          </span>
        )}
        {errorMessage && (
          <span style={{ color: 'var(--danger)', fontSize: 'var(--t-sm)', fontWeight: 700, textAlign: 'center' }}>
            {errorMessage}
          </span>
        )}

        <Button
          variant="lime"
          onClick={handleCompletePayment}
          disabled={isSubmitting || (paymentMethod === 'tunai' && !isCashSufficient) || !isTableSet}
          style={{ marginTop: 'auto', width: '100%' }}
        >
          {isSubmitting ? 'Memproses Pesanan...' : 'Selesaikan pembayaran'}
        </Button>
        {!isTableSet && (
          <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-2)', textAlign: 'center', marginTop: '-4px' }}>
            * Masukkan nomor pada keypad di sebelah kiri
          </span>
        )}
      </div>

      {/* Modal Zoom QRIS Liquid Glass untuk kemudahan pemindaian pembeli */}
      {isQrisZoomed && (
        <div
          onClick={() => setIsQrisZoomed(false)}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 150,
            background: 'var(--ov)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '24px',
            cursor: 'pointer',
          }}
        >
          <div
            className="tk-qris-zoom-glass"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src="/assets/images/qris-clean.png"
              alt="QRIS Tatis Cafe dan Resto"
              style={{
                maxHeight: '380px',
                maxWidth: '85vw',
                objectFit: 'contain',
                borderRadius: '8px',
                display: 'block',
              }}
            />
          </div>
          <Button variant="flat" size="md" onClick={() => setIsQrisZoomed(false)} style={{ minWidth: '160px' }}>
            Tutup Tampilan QRIS
          </Button>
        </div>
      )}
    </div>
  );
};
