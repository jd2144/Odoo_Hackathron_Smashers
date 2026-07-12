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
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-xs';

  const variants: Record<BadgeVariant, string> = {
    primary: 'bg-sahara-sand/10 text-sahara-gold border-sahara-sand/30',
    secondary: 'bg-sahara-gold/10 text-sahara-clay border-sahara-gold/30',
    success: 'bg-sahara-success/10 text-sahara-success border-sahara-success/25',
    warning: 'bg-sahara-warning/10 text-sahara-warning border-sahara-warning/25',
    danger: 'bg-sahara-danger/10 text-sahara-danger border-sahara-danger/25',
    muted: 'bg-sahara-light/40 text-sahara-clay/70 border-sahara-sand/20',

    // Specific asset statuses styled with Sahara theme colors
    'status-available': 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    'status-allocated': 'bg-sahara-sand/15 text-sahara-clay border-sahara-sand/30',
    'status-reserved': 'bg-sahara-beige/20 text-sahara-gold border-sahara-beige/40',
    'status-maintenance': 'bg-sahara-warning/15 text-sahara-terracotta border-sahara-warning/30',
    'status-lost': 'bg-sahara-danger/15 text-sahara-danger border-sahara-danger/30',
    'status-retired': 'bg-sahara-clay/10 text-sahara-clay/80 border-sahara-clay/20',
    'status-disposed': 'bg-sahara-coffee/10 text-sahara-coffee/60 border-sahara-coffee/20',

    // Specific ticket priorities
    'priority-low': 'bg-sahara-olive/10 text-sahara-olive border-sahara-olive/20',
    'priority-medium': 'bg-sahara-beige/25 text-sahara-clay border-sahara-beige/40',
    'priority-high': 'bg-sahara-warning/15 text-sahara-terracotta border-sahara-warning/30',
    'priority-critical': 'bg-sahara-danger/20 text-sahara-danger border-sahara-danger/40 animate-pulse',
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
