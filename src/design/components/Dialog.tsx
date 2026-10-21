import React from 'react';

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
  if (!isOpen) return null;

  return (
    <div className="tk-overlay" onClick={onClose}>
      <div
        className={`g-liquid tk-dialog ${wide ? 'w-wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
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
};
