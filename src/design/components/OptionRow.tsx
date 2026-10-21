import React from 'react';

export interface OptionRowProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
}

export const OptionRow: React.FC<OptionRowProps> = ({
  label,
  active = false,
  className = '',
  ...props
}) => {
  return (
    <button
      type="button"
      className={`tk-option ${active ? 'active' : ''} ${className}`.trim()}
      aria-pressed={active}
      {...props}
    >
      <span>{label}</span>
      {active && <span style={{ fontWeight: 800 }}>✓</span>}
    </button>
  );
};
