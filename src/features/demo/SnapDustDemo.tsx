import React, { useState, useRef } from 'react';
import { SnapDust } from '../../lib/effects/snapDust.ts';

export interface SnapDustDemoProps {
  onClose?: () => void;
}

interface DemoCardData {
  id: number;
  title: string;
  category: string;
  desc: string;
  badge: string;
  icon: string;
}

const INITIAL_CARDS: DemoCardData[] = [
  {
    id: 1,
    title: 'Nasi Goreng Mercon',
    category: 'Makanan Utama',
    desc: 'Pedas membakar dengan suwiran ayam gurih dan rempah khas.',
    badge: 'Spesial',
    icon: '🔥',
  },
  {
    id: 2,
    title: 'Kopi Susu Gula Aren',
    category: 'Minuman Dingin',
    desc: 'Espresso robusta berpadu susu segar dan manis legit gula aren.',
    badge: 'Favorit',
    icon: '☕',
  },
  {
    id: 3,
    title: 'Mie Goreng Komplit',
    category: 'Olahan Mie',
    desc: 'Tekstur kenyal mie telur berpadu bakso, sosis, dan telur orak-arik.',
    badge: 'Andalan',
    icon: '🍜',
  },
  {
    id: 4,
    title: 'Cadburry Vanilla Latte',
    category: 'Minuman Signature',
    desc: 'Cokelat premium Cadburry bercampur aroma vanila lembut creamy.',
    badge: 'Premium',
    icon: '🍫',
  },
  {
    id: 5,
    title: 'Coto Makassar Autentik',
    category: 'Makanan Tradisional',
    desc: 'Kuah rempah kacang kental dengan potongan daging empuk segar.',
    badge: 'Klasik',
    icon: '🍲',
  },
  {
    id: 6,
    title: 'Pisang Goreng Keju Aren',
    category: 'Camilan & Snack',
    desc: 'Pisang kepok manis krispi bertabur parutan keju dan lelehan aren.',
    badge: 'Cemilan',
    icon: '🍌',
  },
];

export const SnapDustDemo: React.FC<SnapDustDemoProps> = ({ onClose }) => {
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [snappedIds, setSnappedIds] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Tekan SNAP untuk menghancurkan separuh kartu secara acak.');

  // Eksekusi Thanos Snap pada separuh kartu acak
  const handleSnap = async () => {
    if (isProcessing) return;

    // Cari kartu yang saat ini masih utuh (belum di-snap)
    const intactCards = INITIAL_CARDS.filter((c) => !snappedIds.has(c.id));
    if (intactCards.length === 0) {
      setStatusMessage('Semua kartu sudah berubah jadi debu! Tekan RESTORE.');
      return;
    }

    // Ambil tepat separuh (50%) dari kartu yang masih utuh secara acak
    const countToSnap = Math.max(1, Math.ceil(intactCards.length / 2));
    const shuffled = [...intactCards].sort(() => Math.random() - 0.5);
    const toSnap = shuffled.slice(0, countToSnap);

    setIsProcessing(true);
    setStatusMessage(`⚡ Menghancurkan ${countToSnap} kartu menjadi debu partikel...`);

    const newSnapped = new Set(snappedIds);
    toSnap.forEach((c) => newSnapped.add(c.id));
    setSnappedIds(newSnapped);

    const promises = toSnap.map((c) => {
      const el = cardRefs.current.get(c.id);
      if (el) {
        return SnapDust.disintegrate(el, {
          particleSize: 3,
          duration: 2200,
          direction: 'ltr',
          wind: { x: 1.2, y: -0.6 },
        });
      }
      return Promise.resolve();
    });

    await Promise.all(promises);
    setIsProcessing(false);
    setStatusMessage('Partikel debu melayang dan memudar. Tekan RESTORE untuk menyusun kembali.');
  };

  // Eksekusi penyusunan ulang debu (Restore)
  const handleRestore = async () => {
    if (isProcessing) return;

    if (snappedIds.size === 0) {
      setStatusMessage('Semua kartu masih utuh.');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('↺ Menyusun ulang partikel debu menjadi elemen utuh...');

    const cardsToRestore = Array.from(snappedIds);
    const promises = cardsToRestore.map((id) => {
      const el = cardRefs.current.get(id);
      if (el) {
        return SnapDust.restore(el);
      }
      return Promise.resolve();
    });

    await Promise.all(promises);
    setSnappedIds(new Set());
    setIsProcessing(false);
    setStatusMessage('Kartu berhasil disusun ulang secara sempurna!');
  };

  // Snap / Restore kartu individual saat kartu diklik
  const handleCardClick = async (card: DemoCardData) => {
    if (isProcessing) return;
    const el = cardRefs.current.get(card.id);
    if (!el) return;

    if (snappedIds.has(card.id)) {
      // Restore kartu tunggal
      setIsProcessing(true);
      await SnapDust.restore(el);
      setSnappedIds((prev) => {
        const next = new Set(prev);
        next.delete(card.id);
        return next;
      });
      setIsProcessing(false);
    } else {
      // Disintegrate kartu tunggal
      setIsProcessing(true);
      setSnappedIds((prev) => new Set(prev).add(card.id));
      await SnapDust.disintegrate(el, {
        particleSize: 3,
        duration: 2200,
        direction: 'ltr',
        wind: { x: 1.2, y: -0.6 },
      });
      setIsProcessing(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'radial-gradient(ellipse at 50% 20%, #200f38 0%, #0c0617 100%)',
        color: '#f3e8ff',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Header Bar dengan Aksen Ungu Gelap */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 28px',
          borderBottom: '1px solid rgba(168, 85, 247, 0.25)',
          background: 'rgba(24, 13, 43, 0.85)',
          backdropFilter: 'blur(20px)',
          flex: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #a855f7 0%, #6b21a8 100%)',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)',
              fontSize: '20px',
            }}
          >
            ⚡
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#faf5ff' }}>
              Thanos Snap Dust Engine (60 FPS)
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#c084fc', fontWeight: 600 }}>
              Pecah Float32Array 3px • Angin & Turbulensi • Canvas Overlay Bebas Leaks
            </p>
          </div>
        </div>

        {/* Action Controls: SNAP & RESTORE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={handleSnap}
            disabled={isProcessing || snappedIds.size === INITIAL_CARDS.length}
            style={{
              height: '46px',
              padding: '0 24px',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              fontSize: '14px',
              fontWeight: 800,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 20px rgba(168, 85, 247, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
              transition: 'transform 0.15s ease, opacity 0.15s ease',
              opacity: isProcessing || snappedIds.size === INITIAL_CARDS.length ? 0.45 : 1,
            }}
          >
            ⚡ SNAP (Hancurkan 50% Acak)
          </button>

          <button
            type="button"
            onClick={handleRestore}
            disabled={isProcessing || snappedIds.size === 0}
            style={{
              height: '46px',
              padding: '0 24px',
              borderRadius: '9999px',
              background: 'rgba(168, 85, 247, 0.12)',
              color: '#d8b4fe',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              fontSize: '14px',
              fontWeight: 700,
              cursor: isProcessing || snappedIds.size === 0 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.15s ease, background 0.15s ease',
              opacity: isProcessing || snappedIds.size === 0 ? 0.45 : 1,
            }}
          >
            ↺ RESTORE (Susun Ulang)
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#e9d5ff',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '16px',
                cursor: 'pointer',
                marginLeft: '8px',
              }}
              aria-label="Tutup demo"
              title="Kembali ke kasir"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Status Bar */}
      <div
        style={{
          padding: '8px 28px',
          background: 'rgba(192, 132, 252, 0.08)',
          borderBottom: '1px solid rgba(168, 85, 247, 0.15)',
          fontSize: '13px',
          color: '#e9d5ff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flex: 'none',
        }}
      >
        <span>{statusMessage}</span>
        <span style={{ fontSize: '12px', color: '#c084fc', fontWeight: 700 }}>
          {snappedIds.size} / {INITIAL_CARDS.length} Kartu Ter-snap
        </span>
      </div>

      {/* Grid Kartu Tema Gelap Aksen Ungu */}
      <main
        style={{
          flex: 1,
          padding: '28px',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '20px',
          alignContent: 'start',
        }}
      >
        {INITIAL_CARDS.map((card) => {
          const isSnapped = snappedIds.has(card.id);
          return (
            <div
              key={card.id}
              ref={(el) => {
                if (el) cardRefs.current.set(card.id, el);
                else cardRefs.current.delete(card.id);
              }}
              onClick={() => handleCardClick(card)}
              style={{
                background: 'linear-gradient(145deg, rgba(38, 18, 70, 0.85) 0%, rgba(20, 10, 38, 0.95) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                borderRadius: '20px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 12px 32px rgba(12, 6, 24, 0.6), inset 0 1px 0 rgba(192, 132, 252, 0.25)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease, transform 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#c084fc',
                  }}
                >
                  {card.category}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    background: 'rgba(168, 85, 247, 0.25)',
                    color: '#f5d0fe',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                  }}
                >
                  {card.badge}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>{card.icon}</span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                  {card.title}
                </h3>
              </div>

              <p style={{ margin: 0, fontSize: '13px', lineHeight: '20px', color: '#d8b4fe' }}>
                {card.desc}
              </p>

              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(168, 85, 247, 0.18)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: '#a855f7',
                  fontWeight: 700,
                }}
              >
                <span>Status: {isSnapped ? '💨 Menjadi Debu' : '✓ Utuh'}</span>
                <span>Klik untuk {isSnapped ? 'Restore' : 'Snap'}</span>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
};
