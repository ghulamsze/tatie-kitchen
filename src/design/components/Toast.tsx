import React from 'react';

export interface ToastProps {
  message: string;
  visible: boolean;
  type?: 'success' | 'danger';
}

export const Toast: React.FC<ToastProps> = ({
  message,
  visible,
  type = 'success',
}) => {
  if (!visible) return null;

  return (
    <div className="g-liquid tk-toast" role="status" aria-live="polite">
      <div className={`tk-toast-icon ${type === 'danger' ? 'danger' : ''}`}>
        {type === 'danger' ? '!' : '✓'}
      </div>
      <span>{message}</span>
    </div>
  );
};
