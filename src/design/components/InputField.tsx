import React from 'react';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  error = false,
  className = '',
  ...props
}) => {
  return (
    <input
      className={`tk-field ${error ? 'error' : ''} ${className}`.trim()}
      {...props}
    />
  );
};
