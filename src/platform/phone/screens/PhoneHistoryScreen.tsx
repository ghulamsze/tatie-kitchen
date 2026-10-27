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
  onBack?: () => void;
}

export const PhoneHistoryScreen: React.FC<PhoneHistoryScreenProps> = ({ onSelectOrder, onBack }) => {
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

  // Kelompok tanggal yang sedang terbuka (hanya "Hari ini" yang terbuka secara default)
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({});
  const todayDateStr = useMemo(() => formatDate(new Date()), []);

  const isDateOpen = (dateKey: string) => {
    if (openDates[dateKey] !== undefined) {
      return openDates[dateKey];
    }
    // Default: hanya hari ini yang terbuka otomatis, tanggal lain tertutup sampai ditekan
    return dateKey === todayDateStr;
  };

  const toggleDate = (dateKey: string) => {
    setOpenDates((prev) => ({
      ...prev,
      [dateKey]: !isDateOpen(dateKey),
    }));
  };

  const handleRowClick = (item: HistoryOrderWithItems) => {
    setSelectedOrder(item);
    if (onSelectOrder) {
      onSelectOrder(item.order.id);
    }
  };

  return (
    <div
      className="tk-phone-screen tk-phone-scrollable tk-custom-slider"
      style={{
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100%',
        paddingBottom: onBack
          ? 'calc(40px + env(safe-area-inset-bottom, 0px))'
          : 'calc(100px + env(safe-area-inset-bottom, 0px))',
        boxSizing: 'border-box',
      }}
    >
      {/* 0. Navigasi Kembali jika dibuka sebagai overlay dari Beranda */}
      {onBack && (
        <div style={{ margin: '8px 4px 10px 4px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ink-2)',
              fontSize: 'var(--t-sm)',
              lineHeight: 'var(--l-sm)',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '6px 0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>‹</span>
            <span>Kembali</span>
          </button>
        </div>
      )}

      {/* 1. Header Riwayat Bersih dengan Tombol Pill Rentang Waktu di Samping Kanan Teks Riwayat */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          margin: '0 4px 16px',
          flexShrink: 0,
        }}
      >
        <h1 className="tk-phone-title" style={{ margin: 0 }}>
          Riwayat
        </h1>

        {/* 2. Tombol Pill Trigger Rentang Waktu di Sebelah Kanan Teks */}
        <div
          className="tk-phone-range-trigger rg g"
          onClick={() => setIsSheetOpen(true)}
          role="button"
          tabIndex={0}
          aria-haspopup="dialog"
          aria-label="Pilih rentang waktu"
          style={{ flexShrink: 0, margin: 0 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsSheetOpen(true);
            }
          }}
        >
          <span>{triggerLabel}</span>
          <span style={{ color: 'var(--ink-3)' }}>▾</span>
        </div>
      </div>

      {/* 3. Daftar Transaksi Dikelompokkan per Tanggal */}
      {groupedOrders.length === 0 ? (
        <div className="tk-phone-list-card" style={{ flexShrink: 0 }}>
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
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            flexShrink: 0,
            width: '100%',
          }}
        >
          {groupedOrders.map(([dateTitle, dayOrders]) => {
            const isExpanded = isDateOpen(dateTitle);
            const isToday = dateTitle === todayDateStr;

            return (
              <div
                key={dateTitle}
                className="tk-phone-list-card"
                style={{
                  flexShrink: 0,
                  margin: '0 4px',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Header Tanggal Dropdown / Collapsible */}
                <div
                  className="tk-phone-date-header dh2"
                  onClick={() => toggleDate(dateTitle)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  style={{
                    background: 'var(--ctl)',
                    color: 'var(--ink-2)',
                    padding: '12px 16px',
                    fontSize: 'var(--t-xs)',
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                    borderBottom: isExpanded ? '1px solid var(--ctl-line)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      toggleDate(dateTitle);
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{dateTitle}</span>
                    {isToday && (
                      <span
                        style={{
                          fontSize: 'var(--t-xs)',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--r-pill)',
                          background: 'color-mix(in srgb, var(--accent) 20%, transparent)',
                          color: 'var(--accent)',
                        }}
                      >
                        Hari ini
                      </span>
                    )}
                    <span style={{ color: 'var(--ink-3)', fontWeight: 600 }}>
                      · {dayOrders.length} transaksi
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: 'var(--t-xs)',
                      color: 'var(--ink-3)',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      display: 'inline-block',
                    }}
                  >
                    ▼
                  </span>
                </div>

                {/* Baris Transaksi per Tanggal (Hanya saat terbuka) */}
                {isExpanded &&
                  dayOrders.map((item) => {
                    const { order, items } = item;
                    const timeStr = formatTime(order.created_at);
                    const totalQty =
                      items?.reduce((sum, it) => sum + (it.qty || 1), 0) || items?.length || 1;
                    const pm = (order.payment_method || 'tunai').toLowerCase();
                    const methodLabel =
                      pm === 'qris'
                        ? 'QRIS'
                        : pm.includes('transfer')
                        ? 'TF Bank'
                        : 'Tunai';

                    return (
                      <div
                        key={order.id}
                        className="tk-phone-row rw"
                        onClick={() => handleRowClick(item)}
                        role="button"
                        tabIndex={0}
                        style={{
                          flexShrink: 0,
                          minHeight: '56px',
                        }}
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
                            {order.table_no === 'Bungkus' ? 'Bungkus' : `Meja ${order.table_no || '-'}`}
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

                        {/* Kolom Kanan: Nominal Rupiah, Jam Transaksi, & Metode Pembayaran */}
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
                            {timeStr} · {methodLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })}
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
