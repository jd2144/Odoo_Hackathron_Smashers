import * as React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40 disabled:pointer-events-none cursor-pointer';
  
  const variants = {
    primary: 'bg-gradient-to-r from-sahara-sand to-sahara-gold text-white shadow-md shadow-sahara-gold/15 hover:shadow-lg hover:shadow-sahara-gold/25 border border-sahara-sand/20 hover:brightness-[1.03]',
    secondary: 'bg-gradient-to-r from-sahara-light to-sahara-beige text-sahara-coffee border border-sahara-sand/30 shadow-xs hover:shadow-md hover:border-sahara-sand/50',
    outline: 'border border-sahara-sand/30 bg-white/75 backdrop-blur-xs text-sahara-coffee hover:bg-sahara-light/40 hover:border-sahara-sand/60 shadow-xs',
    danger: 'bg-gradient-to-r from-sahara-terracotta to-sahara-danger text-white shadow-md shadow-sahara-danger/15 hover:shadow-lg hover:shadow-sahara-danger/25 border border-sahara-terracotta/20 hover:brightness-[1.03]',
    ghost: 'text-sahara-muted hover:text-sahara-coffee hover:bg-sahara-light/30',
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5 font-semibold rounded-lg',
    md: 'px-4.5 py-2 text-sm gap-2 font-semibold',
    lg: 'px-6 py-2.5 text-base gap-2.5 font-bold',
  };

  return (
    <motion.button
      ref={ref}
      whileHover={{ y: -1.5, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="tracking-wide">Processing...</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';
