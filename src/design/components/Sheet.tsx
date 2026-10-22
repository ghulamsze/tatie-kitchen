import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

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


  if (!isOpen) return null;

  const content = (
    <div className="tk-overlay" onClick={onClose} style={{ pointerEvents: 'auto' }}>
      <div
        className="g-liquid tk-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
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

