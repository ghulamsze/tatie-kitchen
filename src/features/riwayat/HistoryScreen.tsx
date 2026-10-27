import React, { useState, useMemo, useEffect } from 'react';
import { useHistoryStore, DateRangePreset, HistoryOrderWithItems } from '../../stores/historyStore.ts';
import { formatRupiah, formatDate, formatTime, getStartOfDayInShopTimezone, formatQueueNo } from '../../lib/format/formatters.ts';
import { Button } from '../../design/components/Button.tsx';
import { Sheet } from '../../design/components/Sheet.tsx';

export const HistoryScreen: React.FC = React.memo(() => {
  const { orders, selectedRange, setRange, selectedOrder, setSelectedOrder } = useHistoryStore();
  const [isRangeSheetOpen, setIsRangeSheetOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRangePreset>(selectedRange);

  useEffect(() => {
    useHistoryStore.getState().fetchOrders().catch(() => {});
  }, []);

  const rangeLabels: Record<DateRangePreset, string> = {
    'hari-ini': 'Hari ini',
    'kemarin': 'Kemarin',
    '7-hari': '7 hari terakhir',
    '30-hari': '30 hari terakhir',
    'semua': 'Semua waktu',
  };

  // Filter transaksi berdasarkan rentang tanggal terpilih pada zona waktu WITA
  const filteredOrders = useMemo(() => {
    const startOfToday = getStartOfDayInShopTimezone();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = startOfToday - 30 * 24 * 60 * 60 * 1000;

    return orders.filter(({ order }) => {
      const orderTime = new Date(order.created_at).getTime();
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
  }, [orders, selectedRange]);

  // Kelompokkan transaksi berdasarkan tanggal string
  const groupedOrders = useMemo(() => {
    const groups: { [dateKey: string]: HistoryOrderWithItems[] } = {};
    for (const item of filteredOrders) {
      const dateStr = formatDate(item.order.created_at);
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(item);
    }
    return groups;
  }, [filteredOrders]);

  const handleApplyRange = () => {
    setRange(tempRange);
    setIsRangeSheetOpen(false);
  };

  return (
    <div
      className="scr"
      style={{
        width: '1024px',
        height: '640px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
        padding: '20px 24px 84px 24px',
      }}
    >
      {/* 1. Header: Judul & Filter Rentang Waktu */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '48px',
          flex: 'none',
          marginBottom: '16px',
        }}
      >
        <h2 style={{ fontSize: 'var(--t-xl)', lineHeight: 'var(--l-xl)', margin: 0, fontWeight: 800 }}>
          Riwayat Transaksi
        </h2>

        {/* Tombol Pemilih Rentang Waktu */}
        <button
          type="button"
          className="tk-btn-flat"
          onClick={() => {
            setTempRange(selectedRange);
            setIsRangeSheetOpen(true);
          }}
          style={{ height: '40px', padding: '0 18px', fontSize: 'var(--t-sm)', fontWeight: 800 }}
          aria-label="Pilih rentang waktu"
        >
          <span style={{ fontWeight: 800 }}>Rentang: {rangeLabels[selectedRange]}</span>
          <span style={{ fontSize: '10px', opacity: 0.7 }}>▼</span>
        </button>
      </div>

      {/* 2. Daftar Transaksi Dikelompokkan Tanggal */}
      <div
        className="g-acrylic tk-history-container"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          borderRadius: 'var(--r-lg)',
          boxSizing: 'border-box',
        }}
      >
        {Object.keys(groupedOrders).length === 0 ? (
          <div
            style={{
              padding: '64px 20px',
              textAlign: 'center',
              color: 'var(--ink-3)',
            }}
          >
            <p style={{ margin: 0, fontSize: 'var(--t-md)' }}>Tidak ada transaksi pada periode ini.</p>
            <small style={{ display: 'block', marginTop: '6px', fontSize: 'var(--t-sm)' }}>
              Pilih rentang tanggal lain atau selesaikan pesanan baru.
            </small>
          </div>
        ) : (
          Object.entries(groupedOrders).map(([dateLabel, groupList]) => (
            <div key={dateLabel}>
              <div className="tk-history-date-header">
                {dateLabel} ({groupList.length} transaksi)
              </div>
              {groupList.map(({ order, items }) => {
                const itemsSummary = items
                  .map((i) => `${i.qty}x ${i.name_snapshot}`)
                  .join(', ');

                return (
                  <div
                    key={order.id}
                    className="tk-history-row"
                    onClick={() => setSelectedOrder({ order, items })}
                    role="button"
                    tabIndex={0}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Info Meja, Antrian & Ringkasan Item */}
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          className="g-liquid"
                          style={{
                            padding: '2px 8px',
                            borderRadius: 'var(--r-sm)',
                            fontWeight: 900,
                            fontSize: 'var(--t-xs)',
                            color: 'var(--accent-ink)',
                          }}
                        >
                          #{formatQueueNo(order.queue_no || 1)}
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 'var(--t-xs)',
                            color: 'var(--ink-1)',
                          }}
                        >
                          {order.table_no === 'Bungkus' ? 'Bungkus' : `Meja ${order.table_no || '-'}`}
                        </span>
                        <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-3)' }}>
                          #{order.id.substring(0, 10)}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--t-sm)',
                          color: 'var(--ink-2)',
                          marginTop: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {itemsSummary || 'Rincian pesanan'}
                      </div>
                    </div>

                    {/* Waktu & Nominal */}
                    <div style={{ textAlign: 'right', flex: 'none' }}>
                      <div style={{ fontWeight: 800, fontSize: 'var(--t-md)' }}>
                        {formatRupiah(order.total_idr)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '2px' }}>
                        <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-3)' }}>
                          {formatTime(order.created_at)}
                        </span>
                        <span
                          style={{
                            fontSize: 'var(--t-xs)',
                            fontWeight: 700,
                            color: 'var(--accent-ink)',
                            background: 'color-mix(in srgb, var(--accent) 20%, transparent)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {(() => {
                            const pm = (order.payment_method || 'tunai').toLowerCase();
                            if (pm === 'qris') return 'QRIS';
                            if (pm.includes('transfer')) return 'TF Bank';
                            return 'Tunai';
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Sheet Rentang Waktu */}
      <Sheet
        isOpen={isRangeSheetOpen}
        onClose={() => setIsRangeSheetOpen(false)}
        title="Pilih rentang waktu"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
          {(Object.keys(rangeLabels) as DateRangePreset[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`ctl-flat ${tempRange === key ? 'active' : ''}`}
              onClick={() => setTempRange(key)}
              style={{
                height: '48px',
                padding: '0 16px',
                borderRadius: 'var(--r-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 'var(--t-md)',
                fontWeight: 800,
                cursor: 'pointer',
                border: tempRange === key ? '2px solid var(--ring)' : '1px solid var(--ctl-line)',
                background: tempRange === key ? 'var(--sel)' : 'var(--ctl)',
                color: 'var(--ink)',
              }}
            >
              <span style={{ fontWeight: 800 }}>{rangeLabels[key]}</span>
              {tempRange === key && <span style={{ color: 'var(--accent-ink)', fontWeight: 800 }}>✓</span>}
            </button>
          ))}

          {/* Exactly ONE lime button in sheet */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <Button variant="flat" size="md" onClick={() => setIsRangeSheetOpen(false)} style={{ flex: 1 }}>
              Batal
            </Button>
            <Button variant="lime" size="md" onClick={handleApplyRange} style={{ flex: 1 }}>
              Terapkan
            </Button>
          </div>
        </div>
      </Sheet>

      {/* Detail Struk Transaksi Terpilih */}
      <Sheet
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title="Rincian Transaksi"
      >
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
            <div
              className="tk-receipt-card"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '16px',
                maxHeight: '260px',
                overflowY: 'auto',
              }}
            >
              <div className="center-bold">Tati’e Kitchen</div>
              <div style={{ textAlign: 'center', padding: '6px 0 2px 0' }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.08em', color: '#666666', fontWeight: 700 }}>
                  NOMOR ANTRIAN
                </div>
                <div style={{ fontSize: '26px', fontWeight: 900, lineHeight: 1.1, color: '#111111', margin: '2px 0' }}>
                  {formatQueueNo(selectedOrder.order.queue_no || 1)}
                </div>
              </div>
              <div className="row-between" style={{ fontSize: '12px', marginTop: '6px' }}>
                <span>No: #{selectedOrder.order.id.substring(0, 10)}</span>
                <span>{selectedOrder.order.table_no === 'Bungkus' ? 'Bungkus' : `Meja ${selectedOrder.order.table_no}`}</span>
              </div>
              <div className="row-between" style={{ fontSize: '12px' }}>
                <span>Waktu:</span>
                <span>{formatDate(selectedOrder.order.created_at)} {formatTime(selectedOrder.order.created_at)}</span>
              </div>
              <hr />
              {selectedOrder.items.map((i) => (
                <div key={i.id} className="row-between" style={{ fontSize: '12px' }}>
                  <span>{i.qty}x {i.name_snapshot}</span>
                  <span>{formatRupiah(i.price_snapshot_idr * i.qty)}</span>
                </div>
              ))}
              <hr />
              <div className="row-between" style={{ fontWeight: 700 }}>
                <span>Total:</span>
                <span>{formatRupiah(selectedOrder.order.total_idr)}</span>
              </div>
              <div className="row-between" style={{ fontSize: '12px' }}>
                <span>Metode Pembayaran:</span>
                <span style={{ fontWeight: 700 }}>
                  {(() => {
                    const pm = (selectedOrder.order.payment_method || 'tunai').toLowerCase();
                    if (pm === 'qris') return 'QRIS';
                    if (pm.includes('transfer')) return 'TF Bank';
                    return 'Tunai';
                  })()}
                </span>
              </div>
              {(() => {
                const pm = (selectedOrder.order.payment_method || 'tunai').toLowerCase();
                if (pm === 'qris' || pm.includes('transfer')) return null;
                return (
                  <>
                    <div className="row-between" style={{ fontSize: '12px' }}>
                      <span>Tunai:</span>
                      <span>{formatRupiah(selectedOrder.order.cash_received_idr)}</span>
                    </div>
                    <div className="row-between" style={{ fontSize: '12px' }}>
                      <span>Kembalian:</span>
                      <span>{formatRupiah(selectedOrder.order.change_idr)}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="flat" size="md" onClick={() => setSelectedOrder(null)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
});
