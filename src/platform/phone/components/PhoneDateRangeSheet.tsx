import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DateRangePreset } from '../../../stores/historyStore.ts';
import { getShopTodayDateStr } from '../../../lib/format/formatters.ts';
import { registerBackHandler } from '../../../lib/device/backButton.ts';

export type ExtendedDateRangeOption = DateRangePreset | 'pilih-tanggal';

export interface PhoneDateRangeSheetProps {
  isOpen: boolean;
  selectedRange: DateRangePreset;
  customDate?: string; // Format YYYY-MM-DD
  onClose: () => void;
  onApply: (range: DateRangePreset, customDate?: string) => void;
}

export const PhoneDateRangeSheet: React.FC<PhoneDateRangeSheetProps> = ({
  isOpen,
  selectedRange,
  customDate,
  onClose,
  onApply,
}) => {
  const [activeOption, setActiveOption] = useState<ExtendedDateRangeOption>(
    customDate ? 'pilih-tanggal' : selectedRange
  );
  const [dateInput, setDateInput] = useState<string>(
    customDate || getShopTodayDateStr()
  );

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('has-modal');
      setActiveOption(customDate ? 'pilih-tanggal' : selectedRange);
      if (customDate) setDateInput(customDate);
    } else {
      document.body.classList.remove('has-modal');
    }
    return () => {
      document.body.classList.remove('has-modal');
    };
  }, [isOpen, selectedRange, customDate]);

  // Tangani tombol back default Android saat sheet rentang waktu terbuka
  useEffect(() => {
    if (!isOpen) return;
    return registerBackHandler(() => {
      onClose();
      return true;
    }, 80);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const options: { id: ExtendedDateRangeOption; label: string }[] = [
    { id: 'hari-ini', label: 'Hari ini' },
    { id: 'kemarin', label: 'Kemarin' },
    { id: '7-hari', label: '7 hari terakhir' },
    { id: '30-hari', label: '30 hari terakhir' },
    { id: 'semua', label: 'Semua waktu' },
    { id: 'pilih-tanggal', label: 'Pilih tanggal…' },
  ];

  const handleApply = () => {
    if (activeOption === 'pilih-tanggal') {
      onApply('hari-ini', dateInput);
    } else {
      onApply(activeOption as DateRangePreset, undefined);
    }
    onClose();
  };

  const content = (
    <div
      className="tk-phone-overlay ov"
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label="Rentang waktu"
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className="g-liquid tk-phone-sheet sh"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto' }}
      >
        <b
          style={{
            fontSize: 'var(--t-lg)',
            lineHeight: 'var(--l-lg)',
            fontWeight: 800,
            color: 'var(--ink)',
            marginBottom: '4px',
          }}
        >
          Rentang waktu
        </b>

        {options.map((opt) => {
          const isSelected = activeOption === opt.id;
          return (
            <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                className={`tk-phone-op op ${isSelected ? 'selected a' : ''}`}
                onClick={() => setActiveOption(opt.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveOption(opt.id);
                  }
                }}
              >
                <span>{opt.label}</span>
                <span className="tk-phone-op-check">{isSelected ? '✓' : ''}</span>
              </div>

              {/* Input tanggal khusus jika opsi 'Pilih tanggal…' aktif */}
              {opt.id === 'pilih-tanggal' && isSelected && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--ctl)',
                    border: '1px solid var(--ctl-line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <label
                    htmlFor="custom-date-picker"
                    style={{
                      fontSize: 'var(--t-sm)',
                      lineHeight: 'var(--l-sm)',
                      color: 'var(--ink-2)',
                      fontWeight: 600,
                    }}
                  >
                    Tanggal:
                  </label>
                  <input
                    id="custom-date-picker"
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--ink)',
                      fontFamily: 'inherit',
                      fontSize: 'var(--t-sm)',
                      lineHeight: 'var(--l-sm)',
                      fontWeight: 700,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* SATU TOMBOL LIME PER SHEET (Aturan Prioritas Highlight) */}
        <button
          type="button"
          className="tk-btn-lime"
          onClick={handleApply}
          style={{
            width: '100%',
            height: '48px',
            marginTop: '8px',
          }}
        >
          Terapkan
        </button>
      </div>
    </div>
  );

  const portalTarget = typeof document !== 'undefined'
    ? (document.getElementById('tk-portal-root') || document.body)
    : null;

  return portalTarget ? createPortal(content, portalTarget) : content;
};
