import React, { useState, useMemo, useEffect } from 'react';
import { useHistoryStore, DateRangePreset, HistoryOrderWithItems } from '../../../stores/historyStore.ts';
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

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [customDate, setCustomDate] = useState<string | undefined>(undefined);

  // Ambil data transaksi terbaru dari Supabase saat layar dibuka
  useEffect(() => {
    useHistoryStore.getState().fetchOrders().catch(() => {});
  }, []);

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

  // Kelompokkan pesanan berdasarkan tanggal WITA (format: 21 Okt 2026)
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

  const handleRowClick = (item: HistoryOrderWithItems) => {
    setSelectedOrder(item);
    if (onSelectOrder) {
      onSelectOrder(item.order.id);
    }
  };

  return (
    <div className="tk-phone-screen" style={{ overflow: 'hidden' }}>
      {/* 1. Header Riwayat Bersih Sesuai Frame 2 PDF */}
      <h1 className="tk-phone-title">Riwayat</h1>

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
        <div
          className="tk-phone-scrollable"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            flex: 1,
            paddingBottom: '24px',
          }}
        >
          {groupedOrders.map(([dateTitle, dayOrders]) => (
            <div key={dateTitle} className="tk-phone-list-card">
              {/* Header Tanggal */}
              <div className="tk-phone-date-header dh2">
                {dateTitle}
              </div>

              {/* Baris Transaksi per Tanggal Sesuai Frame 2 PDF */}
              {dayOrders.map((item) => {
                const { order, items } = item;
                const timeStr = formatTime(order.created_at);
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
                    {/* Kolom Kiri: Meja & Jumlah Item */}
                    <div>
                      <b
                        style={{
                          display: 'block',
                          fontSize: 'var(--t-md)',
                          lineHeight: 'var(--l-md)',
                          fontWeight: 800,
                          color: 'var(--ink)',
                        }}
                      >
                        Meja {order.table_no || '-'}
                      </b>
                      <span
                        style={{
                          display: 'block',
                          color: 'var(--ink-3)',
                          fontSize: 'var(--t-xs)',
                          lineHeight: 'var(--l-xs)',
                          marginTop: '2px',
                        }}
                      >
                        {totalQty} item
                      </span>
                    </div>

                    {/* Kolom Kanan: Nominal Rupiah & Jam Transaksi */}
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
                      <span
                        style={{
                          display: 'block',
                          color: 'var(--ink-3)',
                          fontSize: 'var(--t-xs)',
                          lineHeight: 'var(--l-xs)',
                          marginTop: '2px',
                        }}
                      >
                        {timeStr}
                      </span>
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
