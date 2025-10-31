import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  icon,
  className = '',
  ...props
}) => {
  const baseClasses = 'border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors';
  
  const widthClass = fullWidth ? 'w-full' : '';
  const iconPadding = icon ? 'pl-10' : 'px-3';
  const errorClass = error 
    ? 'border-red-500 focus:ring-red-500' 
    : 'border-gray-300 dark:border-gray-600';
  const backgroundClass = 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white';
  
  const inputClasses = `${baseClasses} ${widthClass} ${iconPadding} py-2 ${errorClass} ${backgroundClass} ${className}`;
  
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={inputClasses}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
};