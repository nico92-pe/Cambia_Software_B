import React from 'react';
import { cn } from '../../lib/utils';
import { Loader } from './Loader';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    destructive: 'btn-destructive',
  };

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-6 text-base',
    icon: 'h-10 w-10 p-0',
  };

  return (
    <button
      className={cn(
        'btn',
        variantClasses[variant],
        sizeClasses[size],
        loading && 'relative text-transparent',
        (disabled || loading) && 'pointer-events-none opacity-70',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {icon && !loading && (
        <span className={cn('mr-2', !children && 'mr-0')}>{icon}</span>
      )}
      {children}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader size="sm" className="text-current" />
        </div>
      )}
    </button>
  );
}