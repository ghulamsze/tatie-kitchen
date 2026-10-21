import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'lime' | 'flat' | 'danger';
  size?: 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'flat',
  size = 'lg',
  fullWidth = false,
  className = '',
  children,
  ...props
}) => {
  const variantClass =
    variant === 'lime'
      ? 'tk-btn-lime'
      : variant === 'danger'
        ? 'tk-btn-flat tk-btn-danger'
        : 'tk-btn-flat';

  const sizeClass = size === 'md' ? 'tk-btn-md' : '';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type="button"
      className={`${variantClass} ${sizeClass} ${widthClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};
