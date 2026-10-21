import React from 'react';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  active = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <button
      type="button"
      className={`tk-chip ${active ? 'active lime' : ''} ${className}`.trim()}
      aria-pressed={active}
      {...props}
    >
      {children}
    </button>
  );
};
