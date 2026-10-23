import React, { useState, useMemo, useEffect } from 'react';
import { useHistoryStore, DateRangePreset, HistoryOrderWithItems } from '../../../stores/historyStore.ts';
import { useCashierStore } from '../../../stores/cashierStore.ts';
import {
  formatRupiah,
  formatDate,
  formatTime,
  getStartOfDayInShopTimezone,
} from '../../../lib/format/formatters.ts';
import { PhoneDateRangeSheet } from '../components/PhoneDateRangeSheet.tsx';

export interface PhoneHistoryScreenProps {
  onSelectOrder?: (orderId: string) => void;
}

export const PhoneHistoryScreen: React.FC<PhoneHistoryScreenProps> = ({ onSelectOrder }) => {
  const { orders, selectedRange, setRange, setSelectedOrder } = useHistoryStore();
  const { cashiers } = useCashierStore();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [customDate, setCustomDate] = useState<string | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ambil data transaksi terbaru dari Supabase saat layar dibuka
  useEffect(() => {
    useHistoryStore.getState().fetchOrders().catch(() => {});
  }, []);

  const getCashierName = (cashierId?: string) => {
    if (!cashierId) return 'Kasir';
    const found = cashiers.find((c) => c.id === cashierId);
    return found ? found.name : 'Kasir';
  };

  // Label rentang waktu untuk tombol pill trigger
  const triggerLabel = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (customDate) {
      return formatDate(new Date(`${customDate}T12:00:00+08:00`));
    }
    switch (selectedRange) {
      case 'hari-ini':
        return `Hari ini · ${formatDate(today)}`;
      case 'kemarin':
        return `Kemarin · ${formatDate(yesterday)}`;
      case '7-hari':
        return '7 hari terakhir';
      case '30-hari':
        return '30 hari terakhir';
      case 'semua':
      default:
        return 'Semua waktu';
    }
  }, [selectedRange, customDate]);

  // Filter pesanan sesuai rentang waktu (WITA)
  const filteredOrders = useMemo(() => {
    const startOfToday = getStartOfDayInShopTimezone();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = startOfToday - 30 * 24 * 60 * 60 * 1000;

    return orders.filter(({ order }) => {
      const orderTime = new Date(order.created_at).getTime();

      if (customDate) {
        const orderDateStr = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Makassar',
        }).format(new Date(order.created_at));
        return orderDateStr === customDate;
      }

      switch (selectedRange) {
        case 'hari-ini':
          return orderTime >= startOfToday;
        case 'kemarin':
          return orderTime >= startOfYesterday && orderTime < startOfToday;
        case '7-hari':
          return orderTime >= sevenDaysAgo;
        case '30-hari':
          return orderTime >= thirtyDaysAgo;
        case 'semua':
        default:
          return true;
      }
    });
  }, [orders, selectedRange, customDate]);

  // Kelompokkan pesanan berdasarkan tanggal WITA (format: 23 Okt 2026)
  const groupedOrders = useMemo(() => {
    const map = new Map<string, HistoryOrderWithItems[]>();
    for (const item of filteredOrders) {
      const dateKey = formatDate(item.order.created_at);
      const list = map.get(dateKey) || [];
      list.push(item);
      map.set(dateKey, list);
    }
    return Array.from(map.entries());
  }, [filteredOrders]);

  const handleApplyRange = (newRange: DateRangePreset, newCustomDate?: string) => {
    setRange(newRange);
    setCustomDate(newCustomDate);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await useHistoryStore.getState().fetchOrders();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRowClick = (item: HistoryOrderWithItems) => {
    setSelectedOrder(item);
    if (onSelectOrder) {
      onSelectOrder(item.order.id);
    }
  };

  return (
    <div className="tk-phone-screen">
      {/* 1. Header Riwayat */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '4px 4px 12px',
        }}
      >
        <h1 className="tk-phone-title" style={{ margin: 0 }}>
          Riwayat
        </h1>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label="Segarkan riwayat"
          style={{
            background: 'var(--ctl)',
            border: '1px solid var(--ctl-line)',
            color: 'var(--ink-2)',
            borderRadius: 'var(--r-pill)',
            padding: '6px 12px',
            fontSize: 'var(--t-xs)',
            lineHeight: 'var(--l-xs)',
            fontWeight: 700,
            cursor: isRefreshing ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ display: 'inline-block', transform: isRefreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s ease' }}>
            ↻
          </span>
          <span>{isRefreshing ? 'Memuat...' : 'Segarkan'}</span>
        </button>
      </div>

      {/* 2. Tombol Pill Trigger Rentang Waktu (Liquid Glass Style) */}
      <div
        className="tk-phone-range-trigger rg g"
        onClick={() => setIsSheetOpen(true)}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-label="Pilih rentang waktu"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsSheetOpen(true);
          }
        }}
      >
        <span>{triggerLabel}</span>
        <span style={{ color: 'var(--ink-3)' }}>▾</span>
      </div>

      {/* 3. Daftar Transaksi Dikelompokkan per Tanggal */}
      {groupedOrders.length === 0 ? (
        <div className="tk-phone-list-card">
          <div
            style={{
              padding: '36px 16px',
              textAlign: 'center',
              color: 'var(--ink-3)',
              fontSize: 'var(--t-sm)',
              lineHeight: 'var(--l-sm)',
            }}
          >
            Belum ada riwayat transaksi pada rentang ini
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {groupedOrders.map(([dateTitle, dayOrders]) => (
            <div key={dateTitle} className="tk-phone-list-card">
              {/* Header Tanggal */}
              <div className="tk-phone-date-header dh2">
                {dateTitle}
              </div>

              {/* Baris Transaksi per Tanggal */}
              {dayOrders.map((item) => {
                const { order, items } = item;
                const timeStr = formatTime(order.created_at);
                const cashierName = getCashierName(order.cashier_id);
                const totalQty =
                  items?.reduce((sum, it) => sum + (it.qty || 1), 0) || items?.length || 1;

                return (
                  <div
                    key={order.id}
                    className="tk-phone-row rw"
                    onClick={() => handleRowClick(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleRowClick(item);
                      }
                    }}
                  >
                    <div>
                      <b
                        style={{
                          display: 'block',
                          fontSize: 'var(--t-md)',
                          lineHeight: 'var(--l-md)',
                          color: 'var(--ink)',
                        }}
                      >
                        Meja {order.table_no || '-'}
                      </b>
                      <small
                        style={{
                          display: 'block',
                          color: 'var(--ink-3)',
                          fontSize: 'var(--t-xs)',
                          lineHeight: 'var(--l-xs)',
                          marginTop: '2px',
                        }}
                      >
                        {timeStr} · {cashierName} · {totalQty} item
                      </small>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <b
                        style={{
                          display: 'block',
                          fontSize: 'var(--t-md)',
                          lineHeight: 'var(--l-md)',
                          fontWeight: 800,
                          color: 'var(--ink)',
                        }}
                      >
                        {formatRupiah(order.total_idr)}
                      </b>
                      <small
                        style={{
                          display: 'block',
                          color: 'var(--ink-3)',
                          fontSize: 'var(--t-xs)',
                          lineHeight: 'var(--l-xs)',
                          marginTop: '2px',
                        }}
                      >
                        Lunas
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* 4. Bottom Sheet Filter Rentang Waktu */}
      <PhoneDateRangeSheet
        isOpen={isSheetOpen}
        selectedRange={selectedRange}
        customDate={customDate}
        onClose={() => setIsSheetOpen(false)}
        onApply={handleApplyRange}
      />
    </div>
  );
};

export default PhoneHistoryScreen;
