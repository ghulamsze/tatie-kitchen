import React from 'react';

export interface ToastProps {
  message: string;
  visible?: boolean;
  type?: 'success' | 'danger';
  actionLabel?: string;
  onAction?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  visible = true,
  type = 'success',
  actionLabel,
  onAction,
}) => {
  if (!visible) return null;

  return (
    <div className="g-liquid tk-toast" role="status" aria-live="polite" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div className={`tk-toast-icon ${type === 'danger' ? 'danger' : ''}`}>
        {type === 'danger' ? '!' : '✓'}
      </div>
      <span>{message}</span>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAction();
          }}
          style={{
            marginLeft: '8px',
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            border: 'none',
            borderRadius: 'var(--r-pill)',
            padding: '3px 10px',
            fontSize: 'var(--t-xs)',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: 'var(--sh-sm)',
            transition: 'transform 0.1s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
