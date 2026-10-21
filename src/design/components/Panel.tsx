import React from 'react';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'acrylic' | 'liquid';
  highlight?: boolean;
}

export const Panel: React.FC<PanelProps> = ({
  variant = 'acrylic',
  highlight = false,
  className = '',
  children,
  ...props
}) => {
  const baseClass = variant === 'liquid' ? 'g-liquid' : 'g-acrylic';
  const highlightClass = highlight ? 'hi' : '';

  return (
    <div className={`tk-panel ${baseClass} ${highlightClass} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};
