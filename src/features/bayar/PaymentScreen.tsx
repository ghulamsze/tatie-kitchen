import React, { useState } from 'react';
import { useCartStore } from '../../stores/cartStore.ts';
import { useCashierStore } from '../../stores/cashierStore.ts';
import { formatRupiah } from '../../lib/format/formatters.ts';
import { Button } from '../../design/components/Button.tsx';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client.ts';
import { Order, OrderItem } from '../../lib/supabase/types.ts';
import { useHistoryStore } from '../../stores/historyStore.ts';

export interface PaymentScreenProps {
  onSuccess: () => void;
  onCancel: () => void;
}

import { getQuickCashOptions } from './quickCash.ts';
import { playPaymentSound } from '../../lib/sound/sound.ts';

export type PaymentMethod = 'tunai' | 'qris' | 'transfer';

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ onSuccess, onCancel }) => {
  const { lines, tableNo, setTableNo, cashReceived, setCashReceived, calculateTotal, clearCart, setLastOrder } = useCartStore();
  const { activeCashier } = useCashierStore();

  const total = calculateTotal();
  // Default meja selalu '...' dengan warna abu-abu
  const [tableInput, setTableInput] = useState<string>(tableNo && tableNo !== '...' && tableNo !== 'x' ? tableNo : '...');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [isManualCash, setIsManualCash] = useState<boolean>(false);
  const [manualCashInput, setManualCashInput] = useState<string>(cashReceived ? String(cashReceived) : '');
  // Default: uang pas (total)
  const [selectedQuickCash, setSelectedQuickCash] = useState<number>(cashReceived || total);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Meja wajib diinput sebelum pembayaran dapat diproses
  const isTableSet = tableInput !== '...' && tableInput !== 'x' && tableInput.trim().length > 0;

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

  // Auto-confirm nomor meja saat digit diketik, maksimal 2 digit dan maksimal meja 15
  const handleKeypadPress = (val: string | number) => {
    if (val === 'Hapus') {
      if (tableInput.length > 1 && tableInput !== '...' && tableInput !== 'x') {
        const next = tableInput.slice(0, -1);
        setTableInput(next);
        setTableNo(next);
      } else {
        setTableInput('...');
        setTableNo('...');
      }
    } else {
      const digit = String(val);
      const isPlaceholder = tableInput === '...' || tableInput === 'x';
      const candidateStr = isPlaceholder ? digit : `${tableInput}${digit}`;

      // Nomor meja maksimal 2 digit
      if (candidateStr.length > 2) {
        return;
      }

      const candidateNum = parseInt(candidateStr, 10);
      // Maksimal nomor meja adalah 15: blokir angka 0 tunggal atau nilai 16+
      if (!isNaN(candidateNum) && candidateNum >= 1 && candidateNum <= 15) {
        setTableInput(candidateStr);
        setTableNo(candidateStr);
      }
    }
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

      const orderId = 'ord-' + Math.random().toString(36).substring(2, 10);
      const cashierId = activeCashier?.id || 'c-001';
      const shopId = activeCashier?.shop_id || 'shop-001';

      let recordedOrder: Order;
      let recordedItems: OrderItem[];

      if (isSupabaseConfigured()) {
        try {
          const payload = {
            id: orderId,
            shop_id: shopId,
            cashier_id: cashierId,
            table_no: finalTableNo,
            cash_received_idr: effectiveCash,
            items: lines.map((l) => ({
              menu_item_id: l.item.id,
              qty: l.qty,
            })),
          };

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rpcPromise = (supabase.rpc as any)('create_order', {
            p_order: payload,
          });
          const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 1200)
          );

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error } = await (Promise.race([rpcPromise, timeoutPromise]) as Promise<any>);

          if (!error && data) {
            recordedOrder = data as Order;
            recordedItems = lines.map((l) => ({
              id: 'oi-' + Math.random().toString(36).substring(2, 7),
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
          }
        } catch {
          // fallback ke pencatatan lokal
        }
      }

      // Fallback pencatatan transaksi lokal
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
        created_at: new Date().toISOString(),
      };

      recordedItems = lines.map((l) => ({
        id: 'oi-' + Math.random().toString(36).substring(2, 7),
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

        {/* Default meja selalu '...' dengan warna abu-abu */}
        <div
          className="tk-table-display"
          style={{
            color: (tableInput === '...' || tableInput === 'x') ? 'var(--ink-3)' : 'var(--ink)',
            userSelect: 'none',
          }}
        >
          {tableInput}
        </div>

        <div className="tk-keypad-grid">
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
          <span style={{ color: 'var(--ink-2)', fontSize: 'var(--t-sm)', lineHeight: 'var(--l-sm)' }}>Total tagihan</span>
          <div style={{ fontSize: 'var(--t-2xl)', lineHeight: 'var(--l-2xl)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
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
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Kolom Input Nominal Manual (Ukuran sama persis dengan tombol lain: height 68px, radius var(--r-md), width 100%) */}
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
                height: '68px',
                padding: '0 16px',
                fontSize: 'var(--t-lg)',
                fontWeight: 700,
                borderRadius: 'var(--r-md)',
                borderColor: isManualActive ? 'var(--ring)' : 'var(--ctl-line)',
                boxShadow: isManualActive ? '0 0 0 2px color-mix(in srgb, var(--ring) 35%, transparent)' : 'none',
                boxSizing: 'border-box',
                width: '100%',
              }}
            />

            {/* Kolom Kembalian */}
            <div className="tk-field" style={{ height: '52px', fontSize: 'var(--t-md)', lineHeight: 'var(--l-md)' }}>
              <span>Kembalian</span>
              <b style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)', color: isCashSufficient ? 'var(--accent-ink)' : 'var(--danger)' }}>
                {formatRupiah(change)}
              </b>
            </div>
          </>
        ) : paymentMethod === 'qris' ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--ctl-line)',
            }}
          >
            <div style={{ width: '130px', height: '130px', background: '#ffffff', borderRadius: '12px', padding: '10px', display: 'grid', placeItems: 'center' }}>
              <svg viewBox="0 0 100 100" width="110" height="110">
                <rect x="0" y="0" width="30" height="30" fill="#000" />
                <rect x="5" y="5" width="20" height="20" fill="#fff" />
                <rect x="10" y="10" width="10" height="10" fill="#000" />
                <rect x="70" y="0" width="30" height="30" fill="#000" />
                <rect x="75" y="5" width="20" height="20" fill="#fff" />
                <rect x="80" y="10" width="10" height="10" fill="#000" />
                <rect x="0" y="70" width="30" height="30" fill="#000" />
                <rect x="5" y="75" width="20" height="20" fill="#fff" />
                <rect x="10" y="80" width="10" height="10" fill="#000" />
                <rect x="40" y="10" width="10" height="20" fill="#000" />
                <rect x="55" y="25" width="10" height="15" fill="#000" />
                <rect x="40" y="45" width="25" height="10" fill="#000" />
                <rect x="70" y="60" width="20" height="10" fill="#000" />
                <rect x="45" y="70" width="15" height="20" fill="#000" />
              </svg>
            </div>
            <b style={{ fontSize: 'var(--t-sm)', color: 'var(--ink)' }}>Scan QRIS Tati’e Kitchen</b>
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
            <div style={{ background: 'var(--ctl)', padding: '12px 16px', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-2)' }}>BCA (Bank Central Asia)</span>
              <b style={{ fontSize: 'var(--t-lg)', letterSpacing: '0.05em' }}>7890-1234-56</b>
              <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-3)' }}>a.n. Tati’e Kitchen Makassar</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <span style={{ color: 'var(--danger)', fontSize: 'var(--t-sm)', fontWeight: 700 }}>
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
    </div>
  );
};
