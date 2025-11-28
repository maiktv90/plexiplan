import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'bg-primary-500 text-white hover:bg-primary-600 shadow-primary hover:shadow-primary-lg',
        primary: 'bg-primary-500 text-white hover:bg-primary-600 shadow-primary hover:shadow-primary-lg',
        secondary: 'bg-gray-500 text-white hover:bg-gray-600',
        outline: 'border border-gray-300 text-gray-700 hover:border-primary-500 hover:text-primary-500 dark:border-gray-600 dark:text-gray-300 dark:hover:border-primary-400 dark:hover:text-primary-400 bg-transparent',
        ghost: 'text-gray-700 hover:bg-primary-50 hover:text-primary-600 dark:text-gray-300 dark:hover:bg-primary-900/20 dark:hover:text-primary-400',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        link: 'text-primary-500 underline-offset-4 hover:underline',
      },
      size: {
        default: 'px-4 py-2 text-sm',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  fullWidth?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          buttonVariants({ variant, size }),
          fullWidth && 'w-full',
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
