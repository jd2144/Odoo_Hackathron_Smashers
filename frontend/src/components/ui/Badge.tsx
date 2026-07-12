import * as React from 'react';

export type BadgeVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'muted'
  | 'status-available'
  | 'status-allocated'
  | 'status-reserved'
  | 'status-maintenance'
  | 'status-lost'
  | 'status-retired'
  | 'status-disposed'
  | 'priority-low'
  | 'priority-medium'
  | 'priority-high'
  | 'priority-critical';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = '',
  variant = 'muted',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide border';

  const variants: Record<BadgeVariant, string> = {
    primary: 'bg-brand-primary/5 text-brand-primary border-brand-primary/20',
    secondary: 'bg-brand-secondary/5 text-brand-secondary border-brand-secondary/20',
    success: 'bg-brand-success/5 text-brand-success border-brand-success/20',
    warning: 'bg-brand-warning/5 text-brand-warning border-brand-warning/20',
    danger: 'bg-brand-danger/5 text-brand-danger border-brand-danger/20',
    muted: 'bg-gray-100 text-brand-muted border-brand-border',

    // Specific asset statuses
    'status-available': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'status-allocated': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'status-reserved': 'bg-amber-50 text-amber-700 border-amber-200',
    'status-maintenance': 'bg-orange-50 text-orange-700 border-orange-200',
    'status-lost': 'bg-rose-50 text-rose-700 border-rose-200',
    'status-retired': 'bg-slate-100 text-slate-700 border-slate-200',
    'status-disposed': 'bg-gray-100 text-gray-500 border-gray-200',

    // Specific ticket priorities
    'priority-low': 'bg-blue-50 text-blue-700 border-blue-100',
    'priority-medium': 'bg-amber-50 text-amber-700 border-amber-100',
    'priority-high': 'bg-orange-50 text-orange-700 border-orange-100',
    'priority-critical': 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
  };

  return (
    <span 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </span>
  );
};
