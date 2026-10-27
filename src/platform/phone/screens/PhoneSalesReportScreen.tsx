import React, { useState, useMemo, useEffect } from 'react';
import { useHistoryStore, DateRangePreset } from '../../../stores/historyStore.ts';
import { useMenuStore } from '../../../stores/menuStore.ts';
import {
  formatRupiah,
  formatDate,
  getShopTodayDateStr,
  getStartOfDayInShopTimezone,
} from '../../../lib/format/formatters.ts';
import { PhoneDateRangeSheet } from '../components/PhoneDateRangeSheet.tsx';

export interface PhoneSalesReportScreenProps {
  onBack: () => void;
}

export const PhoneSalesReportScreen: React.FC<PhoneSalesReportScreenProps> = ({ onBack }) => {
  const { orders, fetchOrders } = useHistoryStore();
  const { items: allMenuItems, fetchMenu } = useMenuStore();

  const [selectedRange, setSelectedRange] = useState<DateRangePreset>('hari-ini');
  const [customDate, setCustomDate] = useState<string | undefined>(undefined);
  const [isRangeSheetOpen, setIsRangeSheetOpen] = useState(false);
  const [selectedBarIdx, setSelectedBarIdx] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders().catch(() => {});
    fetchMenu().catch(() => {});
  }, [fetchOrders, fetchMenu]);

  // Label rentang waktu untuk tombol pill trigger (persis seperti di Riwayat)
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

  // Ringkasan Total Omzet & Transaksi
  const { totalOmzet, totalCount } = useMemo(() => {
    let omzet = 0;
    filteredOrders.forEach(({ order }) => {
      omzet += order.total_idr || 0;
    });
    return { totalOmzet: omzet, totalCount: filteredOrders.length };
  }, [filteredOrders]);

  // Rincian Metode Pembayaran
  const paymentBreakdown = useMemo(() => {
    let tunai = 0, tunaiCount = 0;
    let qris = 0, qrisCount = 0;
    let tf = 0, tfCount = 0;

    filteredOrders.forEach(({ order }) => {
      const pm = (order.payment_method || 'tunai').toLowerCase();
      const total = order.total_idr || 0;
      if (pm === 'qris') {
        qris += total;
        qrisCount += 1;
      } else if (pm.includes('transfer')) {
        tf += total;
        tfCount += 1;
      } else {
        tunai += total;
        tunaiCount += 1;
      }
    });

    return { tunai, tunaiCount, qris, qrisCount, tf, tfCount };
  }, [filteredOrders]);

  // Statistik Item Terjual & Menu Terlaris dengan Foto Asli
  const topItems = useMemo(() => {
    const itemMap = new Map<
      string,
      { name: string; qty: number; total: number; photoPath?: string }
    >();
    let totalItemsSold = 0;

    filteredOrders.forEach(({ items }) => {
      (items || []).forEach((it: any) => {
        const name = it.name_snapshot || 'Menu';
        const qty = it.qty || 1;
        const price = it.price_snapshot_idr || 0;
        totalItemsSold += qty;

        const existing = itemMap.get(name) || {
          name,
          qty: 0,
          total: 0,
          photoPath: undefined,
        };

        existing.qty += qty;
        existing.total += price * qty;

        if (!existing.photoPath) {
          const found = allMenuItems.find(
            (m) => m.name.toLowerCase() === name.toLowerCase()
          );
          if (found?.photo_path) {
            existing.photoPath = found.photo_path;
          }
        }

        itemMap.set(name, existing);
      });
    });

    const sorted = Array.from(itemMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const maxQty = sorted.length > 0 ? sorted[0].qty : 1;

    return { sorted, totalItemsSold, maxQty };
  }, [filteredOrders, allMenuItems]);

  const avgOrderValue = totalCount > 0 ? Math.round(totalOmzet / totalCount) : 0;

  // Apakah rentang waktu berupa satu hari penuh (Hari Ini / Kemarin / Pilih Tanggal)
  const isSingleDay = selectedRange === 'hari-ini' || selectedRange === 'kemarin' || Boolean(customDate);

  // Struktur Data Grafik:
  // 1. Single Day: Pembagian Jam Pesan (08-10, 10-12, 12-14, 14-16, 16-18, 18-20, 20-22, 22-24)
  // 2. Multi-Day (7 hari / 30 hari / semua): Pembagian Tanggal
  const chartData = useMemo(() => {
    if (isSingleDay) {
      const hourBuckets = [
        { label: '08-10', startH: 8, endH: 10, fullLabel: '08:00 - 10:00', total: 0, count: 0 },
        { label: '10-12', startH: 10, endH: 12, fullLabel: '10:00 - 12:00', total: 0, count: 0 },
        { label: '12-14', startH: 12, endH: 14, fullLabel: '12:00 - 14:00', total: 0, count: 0 },
        { label: '14-16', startH: 14, endH: 16, fullLabel: '14:00 - 16:00', total: 0, count: 0 },
        { label: '16-18', startH: 16, endH: 18, fullLabel: '16:00 - 18:00', total: 0, count: 0 },
        { label: '18-20', startH: 18, endH: 20, fullLabel: '18:00 - 20:00', total: 0, count: 0 },
        { label: '20-22', startH: 20, endH: 22, fullLabel: '20:00 - 22:00', total: 0, count: 0 },
        { label: '22-24', startH: 22, endH: 24, fullLabel: '22:00 - 24:00', total: 0, count: 0 },
      ];

      filteredOrders.forEach(({ order }) => {
        const orderDate = new Date(order.created_at);
        const hourStr = new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Makassar',
          hour: 'numeric',
          hour12: false,
        }).format(orderDate);
        const hour = parseInt(hourStr, 10);
        const total = order.total_idr || 0;

        let bucket = hourBuckets.find((b) => hour >= b.startH && hour < b.endH);
        if (!bucket) {
          if (hour < 8) bucket = hourBuckets[0];
          else bucket = hourBuckets[hourBuckets.length - 1];
        }
        bucket.total += total;
        bucket.count += 1;
      });

      return {
        type: 'hourly' as const,
        items: hourBuckets,
      };
    }

    // Multi-Day (e.g. 7 hari terakhir)
    if (selectedRange === '7-hari') {
      const days: { dateKey: string; label: string; fullLabel: string; total: number; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateKey = getShopTodayDateStr(d);
        const dayName = new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Makassar',
          weekday: 'short',
        }).format(d);
        const dayNum = new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Makassar',
          day: 'numeric',
          month: 'short',
        }).format(d);

        days.push({
          dateKey,
          label: dayName,
          fullLabel: `${dayName}, ${dayNum}`,
          total: 0,
          count: 0,
        });
      }

      filteredOrders.forEach(({ order }) => {
        const orderDate = new Date(order.created_at);
        const orderDateKey = getShopTodayDateStr(orderDate);
        const match = days.find((d) => d.dateKey === orderDateKey);
        if (match) {
          match.total += order.total_idr || 0;
          match.count += 1;
        }
      });

      return {
        type: 'daily' as const,
        items: days,
      };
    }

    // 30-hari atau Semua Waktu: Kelompokkan per tanggal yang aktif
    const dateMap = new Map<string, { label: string; fullLabel: string; total: number; count: number }>();
    filteredOrders.forEach(({ order }) => {
      const orderDate = new Date(order.created_at);
      const dateKey = getShopTodayDateStr(orderDate);
      const dayFormatted = formatDate(orderDate);
      const existing = dateMap.get(dateKey) || {
        label: dayFormatted.split(' ').slice(0, 2).join(' '),
        fullLabel: dayFormatted,
        total: 0,
        count: 0,
      };
      existing.total += order.total_idr || 0;
      existing.count += 1;
      dateMap.set(dateKey, existing);
    });

    const items = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10) // Tampilkan maksimal 10 hari terakhir agar muat rapi di layar
      .map(([, v]) => v);

    return {
      type: 'daily' as const,
      items: items.length > 0 ? items : [
        { label: 'Hari ini', fullLabel: 'Hari ini', total: totalOmzet, count: totalCount },
      ],
    };
  }, [isSingleDay, filteredOrders, selectedRange, totalOmzet, totalCount]);

  const maxChartValue = useMemo(() => {
    const max = Math.max(...chartData.items.map((it) => it.total), 0);
    return max > 0 ? max : 1;
  }, [chartData]);

  // Item bar yang sedang aktif diinspeksi (default ke yang memiliki omzet tertinggi jika ada, atau bar terakhir)
  const activeBar = useMemo(() => {
    if (selectedBarIdx !== null && chartData.items[selectedBarIdx]) {
      return chartData.items[selectedBarIdx];
    }
    const withSales = chartData.items.filter((it) => it.total > 0);
    if (withSales.length > 0) {
      return withSales.reduce((prev, curr) => (curr.total > prev.total ? curr : prev));
    }
    return chartData.items[chartData.items.length - 1];
  }, [selectedBarIdx, chartData]);

  const handleApplyRange = (newRange: DateRangePreset, newCustomDate?: string) => {
    setSelectedRange(newRange);
    setCustomDate(newCustomDate);
    setSelectedBarIdx(null);
  };

  return (
    <div
      className="tk-phone-screen tk-phone-scrollable tk-custom-slider"
      style={{
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* 1. Tombol Navigasi Kembali */}
      <div style={{ margin: '8px 4px 10px 4px' }}>
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

      {/* 2. Judul Layar Bersih Tanpa Sub-deskripsi */}
      <h1 className="tk-phone-title">Laporan Penjualan</h1>

      {/* 3. Tombol Pill Trigger Rentang Waktu (Tinggi 52px Nyaman dan Diperlebar) */}
      <div
        className="tk-phone-range-trigger rg g"
        onClick={() => setIsRangeSheetOpen(true)}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-label="Pilih rentang waktu laporan"
        style={{
          height: '52px',
          minHeight: '52px',
          padding: '0 20px',
          margin: '0 4px 16px',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsRangeSheetOpen(true);
          }
        }}
      >
        <span style={{ fontSize: 'var(--t-sm)', fontWeight: 700, color: 'var(--ink)' }}>
          {triggerLabel}
        </span>
        <span style={{ color: 'var(--ink-3)', fontSize: '13px' }}>▾</span>
      </div>

      {/* 4. Hero Card Ringkasan Omzet & Transaksi (Bersih tanpa bagian merah shoulder) */}
      <div className="g-acrylic tk-phone-hero" style={{ margin: '0 4px 14px' }}>
        <span
          style={{
            fontSize: 'var(--t-sm)',
            lineHeight: 'var(--l-sm)',
            color: 'var(--ink-2)',
            fontWeight: 500,
          }}
        >
          Total Penjualan
        </span>

        <div
          className="tk-phone-hero-amount"
          style={{
            letterSpacing: '-0.02em',
            fontSize: 'var(--t-xl)',
            marginTop: '4px',
            marginBottom: '4px',
          }}
        >
          {formatRupiah(totalOmzet)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: 'var(--t-sm)',
              lineHeight: 'var(--l-sm)',
              color: 'var(--ink-3)',
              fontWeight: 700,
            }}
          >
            {totalCount} transaksi
          </span>
          <span style={{ color: 'var(--ink-3)' }}>·</span>
          <span
            style={{
              fontSize: 'var(--t-sm)',
              lineHeight: 'var(--l-sm)',
              color: 'var(--ink-3)',
              fontWeight: 600,
            }}
          >
            {topItems.totalItemsSold} item terjual
          </span>
        </div>
      </div>

      {/* 5. Grafik Penjualan (Bersih Tanpa Badge Header) */}
      <div
        className="g-acrylic"
        style={{
          borderRadius: 'var(--r-xl)',
          padding: '16px',
          margin: '0 4px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Header Grafik Bersih Tanpa Badge */}
        <div>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--ink-3)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Grafik Penjualan
          </span>
        </div>

        {/* Info Bar yang Dipilih / Peak Hour */}
        {activeBar && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              padding: '8px 12px',
              borderRadius: 'var(--r-md)',
              background: 'var(--card-sub)',
              border: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: 'var(--t-xs)', fontWeight: 700, color: 'var(--ink)' }}>
              {activeBar.fullLabel}
            </span>
            <span style={{ fontSize: 'var(--t-xs)', fontWeight: 800, color: 'var(--accent)' }}>
              {formatRupiah(activeBar.total)}{' '}
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--ink-3)' }}>
                ({activeBar.count} trx)
              </span>
            </span>
          </div>
        )}

        {/* Visual Bar Chart */}
        <div
          style={{
            height: '124px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '6px',
            paddingTop: '8px',
            boxSizing: 'border-box',
          }}
        >
          {chartData.items.map((bar, idx) => {
            const heightPercent = bar.total > 0
              ? Math.max(12, Math.round((bar.total / maxChartValue) * 100))
              : 6;
            const isSelected = activeBar?.fullLabel === bar.fullLabel;

            return (
              <div
                key={bar.fullLabel + idx}
                onClick={() => setSelectedBarIdx(idx)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                {/* Kolom Bar */}
                <div
                  style={{
                    width: '100%',
                    maxWidth: '32px',
                    height: `${heightPercent}%`,
                    borderRadius: 'var(--r-sm)',
                    background: isSelected
                      ? 'var(--accent)'
                      : bar.total > 0
                      ? 'color-mix(in srgb, var(--accent) 45%, var(--ctl-line))'
                      : 'var(--card-sub)',
                    boxShadow: isSelected
                      ? '0 0 12px color-mix(in srgb, var(--accent) 40%, transparent)'
                      : 'none',
                    transition: 'height 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.15s ease',
                    minHeight: '6px',
                  }}
                />

                {/* Label Bawah */}
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? 'var(--ink)' : 'var(--ink-3)',
                    marginTop: '6px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}
                >
                  {bar.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Card Rincian Metode Pembayaran (Format Bubble Persis seperti Gambar 2) */}
      <div style={{ margin: '0 4px 14px' }}>
        <div style={{ margin: '0 0 8px 4px' }}>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--ink-3)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Metode Pembayaran
          </span>
        </div>

        <div className="tk-phone-list-card" style={{ margin: 0 }}>
          {/* Baris 1: Tunai */}
          <div className="tk-phone-row">
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
                Tunai
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
                {paymentBreakdown.tunaiCount} transaksi
              </span>
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
                {formatRupiah(paymentBreakdown.tunai)}
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
                {totalOmzet > 0
                  ? `${Math.round((paymentBreakdown.tunai / totalOmzet) * 100)}% omzet`
                  : '0% omzet'}
              </span>
            </div>
          </div>

          {/* Baris 2: QRIS */}
          <div className="tk-phone-row">
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
                QRIS
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
                {paymentBreakdown.qrisCount} transaksi
              </span>
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
                {formatRupiah(paymentBreakdown.qris)}
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
                {totalOmzet > 0
                  ? `${Math.round((paymentBreakdown.qris / totalOmzet) * 100)}% omzet`
                  : '0% omzet'}
              </span>
            </div>
          </div>

          {/* Baris 3: TF Bank */}
          <div className="tk-phone-row">
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
                TF Bank
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
                {paymentBreakdown.tfCount} transaksi
              </span>
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
                {formatRupiah(paymentBreakdown.tf)}
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
                {totalOmzet > 0
                  ? `${Math.round((paymentBreakdown.tf / totalOmzet) * 100)}% omzet`
                  : '0% omzet'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Statistik Rata-rata Transaksi */}
      <div
        className="g-acrylic"
        style={{
          borderRadius: 'var(--r-lg)',
          padding: '12px 16px',
          margin: '0 4px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid var(--border)',
        }}
      >
        <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-3)', fontWeight: 600 }}>
          Rata-rata Nilai Transaksi
        </span>
        <b style={{ fontSize: 'var(--t-sm)', fontWeight: 800, color: 'var(--ink)' }}>
          {formatRupiah(avgOrderValue)}
        </b>
      </div>

      {/* 8. Menu Terlaris (Desain Keren dengan Medali, Foto Makanan Besar, & Bar Progres) */}
      {topItems.sorted.length > 0 && (
        <div
          className="g-acrylic"
          style={{
            borderRadius: 'var(--r-xl)',
            padding: '18px 16px',
            margin: '0 4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--ink-3)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Menu Terlaris
            </span>
            <span style={{ fontSize: '11px', color: 'var(--ink-3)', fontWeight: 600 }}>
              Top {topItems.sorted.length} Menu
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {topItems.sorted.map((item, idx) => {
              // Gaya Medali Peringkat
              const badgeStyle =
                idx === 0
                  ? {
                      background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                      color: '#ffffff',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.45)',
                    }
                  : idx === 1
                  ? {
                      background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                      color: '#ffffff',
                    }
                  : idx === 2
                  ? {
                      background: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
                      color: '#ffffff',
                    }
                  : {
                      background: 'var(--ctl)',
                      color: 'var(--ink-2)',
                    };

              const percentShare = Math.round((item.qty / topItems.maxQty) * 100);

              return (
                <div
                  key={item.name}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px 14px',
                    borderRadius: 'var(--r-lg)',
                    background: 'var(--card-sub)',
                    border: '1px solid var(--border)',
                    gap: '10px',
                    transition: 'transform 0.1s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    {/* Bagian Kiri: Medali Peringkat, Foto Makanan, Nama & Jumlah Terjual */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                      {/* Medali Peringkat */}
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          fontSize: '11px',
                          fontWeight: 900,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          ...badgeStyle,
                        }}
                      >
                        {idx + 1}
                      </span>

                      {/* Foto Menu */}
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: 'var(--r-md)',
                          overflow: 'hidden',
                          background: 'var(--ctl)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.18)',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {item.photoPath ? (
                          <img
                            src={item.photoPath}
                            alt={item.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                            loading="lazy"
                          />
                        ) : (
                          <span style={{ fontSize: '20px' }}>🍽️</span>
                        )}
                      </div>

                      {/* Info Teks Menu */}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <b
                          style={{
                            display: 'block',
                            fontSize: 'var(--t-sm)',
                            lineHeight: 'var(--l-sm)',
                            fontWeight: 800,
                            color: 'var(--ink)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.name}
                        </b>
                        <span
                          style={{
                            display: 'block',
                            fontSize: '11px',
                            color: 'var(--ink-3)',
                            fontWeight: 600,
                            marginTop: '2px',
                          }}
                        >
                          {item.qty} porsi terjual
                        </span>
                      </div>
                    </div>

                    {/* Bagian Kanan: Total Omzet dari Menu Ini */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <b
                        style={{
                          display: 'block',
                          fontSize: 'var(--t-sm)',
                          lineHeight: 'var(--l-sm)',
                          fontWeight: 800,
                          color: 'var(--ink)',
                        }}
                      >
                        {formatRupiah(item.total)}
                      </b>
                      <span
                        style={{
                          display: 'block',
                          fontSize: '10px',
                          color: 'var(--ink-3)',
                          fontWeight: 600,
                          marginTop: '2px',
                        }}
                      >
                        {totalOmzet > 0
                          ? `${Math.round((item.total / totalOmzet) * 100)}% omzet`
                          : '0%'}
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar Porsi Terjual */}
                  <div
                    style={{
                      height: '4px',
                      width: '100%',
                      background: 'color-mix(in srgb, var(--ink) 8%, transparent)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${percentShare}%`,
                        background:
                          idx === 0
                            ? 'var(--accent)'
                            : 'color-mix(in srgb, var(--accent) 65%, var(--ctl-line))',
                        borderRadius: '2px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 9. Bottom Sheet Filter Rentang Waktu */}
      <PhoneDateRangeSheet
        isOpen={isRangeSheetOpen}
        selectedRange={selectedRange}
        customDate={customDate}
        onClose={() => setIsRangeSheetOpen(false)}
        onApply={handleApplyRange}
      />
    </div>
  );
};

export default PhoneSalesReportScreen;
