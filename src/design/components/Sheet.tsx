import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { registerBackHandler } from '../../lib/device/backButton.ts';

export interface SheetProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('tk-modal-open');
      document.querySelector('.tk-tablet-root')?.classList.add('tk-has-modal');
    }
    return () => {
      document.body.classList.remove('tk-modal-open');
      document.querySelector('.tk-tablet-root')?.classList.remove('tk-has-modal');
    };
  }, [isOpen]);

  // Tangani tombol back default Android saat sheet terbuka
  useEffect(() => {
    if (!isOpen || !onClose) return;
    return registerBackHandler(() => {
      onClose();
      return true;
    }, 70);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = (
    <div
      className="tk-overlay"
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      style={{ pointerEvents: 'auto', touchAction: 'none' }}
    >
      <div
        className="g-liquid tk-sheet"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ pointerEvents: 'auto' }}
      >
        {title && (
          <div style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)', fontWeight: 800 }}>
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  );

  const portalTarget = mounted && typeof document !== 'undefined'
    ? (document.getElementById('tk-portal-root') || document.body)
    : null;

  return portalTarget ? createPortal(content, portalTarget) : content;
};

