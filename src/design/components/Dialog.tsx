import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface DialogProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  description?: string;
  wide?: boolean;
  children?: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  wide = false,
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
    <div
      className="tk-overlay"
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      style={{ pointerEvents: 'auto', touchAction: 'none' }}
    >
      <div
        className={`g-liquid tk-dialog ${wide ? 'w-wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ pointerEvents: 'auto' }}
      >
        <div style={{ fontSize: 'var(--t-lg)', lineHeight: 'var(--l-lg)', fontWeight: 800 }}>
          {title}
        </div>
        {description && (
          <div style={{ color: 'var(--ink-2)', fontSize: 'var(--t-sm)', lineHeight: 'var(--l-sm)' }}>
            {description}
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

