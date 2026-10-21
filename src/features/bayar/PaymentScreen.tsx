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

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ onSuccess, onCancel }) => {
  const { lines, tableNo, setTableNo, cashReceived, setCashReceived, calculateTotal, clearCart, setLastOrder } = useCartStore();
  const { activeCashier } = useCashierStore();

  const total = calculateTotal();
  const [tableInput, setTableInput] = useState<string>(tableNo || '4');
  const [selectedQuickCash, setSelectedQuickCash] = useState<number>(cashReceived || total || 100000);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const change = Math.max(0, selectedQuickCash - total);

  // Opsi cepat uang diterima
  const quickCashOptions = [
    { label: 'Uang pas', amount: total },
    { label: formatRupiah(Math.max(100000, total)), amount: Math.max(100000, total) },
    { label: formatRupiah(Math.max(50000, total)), amount: Math.max(50000, total) },
    { label: 'Jumlah lain', amount: selectedQuickCash },
  ];

  const handleKeypadPress = (val: string | number) => {
    if (val === 'Hapus') {
      setTableInput((prev) => (prev.length > 0 ? prev.slice(0, -1) : ''));
    } else if (val === 'OK') {
      setTableNo(tableInput || '1');
    } else {
      setTableInput((prev) => (prev.length < 3 ? `${prev}${val}` : prev));
    }
  };

  const handleSelectCash = (amt: number) => {
    setSelectedQuickCash(amt);
    setCashReceived(amt);
  };

  const handleCompletePayment = async () => {
    const finalTableNo = tableInput || '4';
    setTableNo(finalTableNo);

    if (selectedQuickCash < total) {
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
            cash_received_idr: selectedQuickCash,
            items: lines.map((l) => ({
              menu_item_id: l.item.id,
              qty: l.qty,
            })),
          };

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error } = await (supabase.rpc as any)('create_order', {
            p_order: payload,
          });

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
        cash_received_idr: selectedQuickCash,
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
      {/* Panel Kiri: Keypad Meja */}
      <div className="g-acrylic tk-table-keypad-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)', fontWeight: 800 }}>
            Nomor meja
          </h3>
          <Button variant="flat" size="md" onClick={onCancel}>
            Kembali
          </Button>
        </div>

        <div className="tk-table-display">
          {tableInput || '-'}
        </div>

        <div className="tk-keypad-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'Hapus', 0, 'OK'].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleKeypadPress(key)}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Panel Kanan: Pembayaran Tunai & Kembalian */}
      <div className="g-acrylic tk-payment-panel">
        <h3 style={{ margin: 0, fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)', fontWeight: 800 }}>
          Pembayaran tunai
        </h3>

        <div>
          <span style={{ color: 'var(--ink-2)', fontSize: 'var(--t-sm)', lineHeight: 'var(--l-sm)' }}>Total</span>
          <div style={{ fontSize: 'var(--t-2xl)', lineHeight: 'var(--l-2xl)', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {formatRupiah(total)}
          </div>
        </div>

        {/* Pilihan Cepat Uang Tunai */}
        <div className="tk-quick-cash-grid">
          {quickCashOptions.map((opt, i) => (
            <button
              key={i}
              type="button"
              className={selectedQuickCash === opt.amount ? 'selected' : ''}
              onClick={() => handleSelectCash(opt.amount)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Kolom Kembalian */}
        <div className="tk-field" style={{ height: '56px', fontSize: 'var(--t-md)', lineHeight: 'var(--l-md)' }}>
          <span>Kembalian</span>
          <b style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)' }}>
            {formatRupiah(change)}
          </b>
        </div>

        {errorMessage && (
          <span style={{ color: 'var(--danger)', fontSize: 'var(--t-sm)', fontWeight: 700 }}>
            {errorMessage}
          </span>
        )}

        <Button
          variant="lime"
          onClick={handleCompletePayment}
          disabled={isSubmitting || selectedQuickCash < total}
          style={{ marginTop: 'auto', width: '100%' }}
        >
          {isSubmitting ? 'Memproses Pesanan...' : 'Selesaikan pembayaran'}
        </Button>
      </div>
    </div>
  );
};
