import React from 'react';
import { cn } from '../../lib/utils';
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  XCircle
} from 'lucide-react';

type AlertVariant = 'default' | 'success' | 'warning' | 'destructive';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const alertVariants = {
  default: 'bg-primary/15 text-primary border-primary/20',
  success: 'bg-success/15 text-success border-success/20',
  warning: 'bg-warning/15 text-warning-foreground border-warning/20',
  destructive: 'bg-destructive/15 text-destructive border-destructive/20',
};

const alertIcons = {
  default: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  destructive: XCircle,
};

export function Alert({
  variant = 'default',
  title,
  children,
  className,
}: AlertProps) {
  const IconComponent = alertIcons[variant];
  
  return (
    <div
      className={cn(
        'relative rounded-lg border p-4 animate-in fade-in duration-200',
        alertVariants[variant],
        className
      )}
    >
      <div className="flex gap-3">
        <IconComponent className="h-5 w-5 mt-0.5" />
        <div className="space-y-1">
          {title && (
            <h5 className="font-medium leading-none tracking-tight">
              {title}
            </h5>
          )}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}