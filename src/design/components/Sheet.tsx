import React from 'react';

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
  if (!isOpen) return null;

  return (
    <div className="tk-overlay" onClick={onClose}>
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
};
