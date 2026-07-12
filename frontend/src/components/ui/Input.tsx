import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  className = '',
  type = 'text',
  label,
  error,
  helperText,
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label 
          htmlFor={inputId} 
          className="text-xs font-semibold text-brand-text/80 uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      
      <input
        id={inputId}
        type={type}
        ref={ref}
        className={`
          w-full px-3.5 py-2 text-sm bg-white border rounded-lg transition-all outline-none
          placeholder:text-gray-400
          ${error 
            ? 'border-brand-danger focus:border-brand-danger focus:ring-2 focus:ring-brand-danger/20' 
            : 'border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10'
          }
          disabled:bg-gray-50 disabled:text-gray-500
          ${className}
        `}
        {...props}
      />
      
      {error && (
        <span className="text-xs text-brand-danger font-medium animate-fade-in">
          {error}
        </span>
      )}
      
      {!error && helperText && (
        <span className="text-xs text-brand-muted">
          {helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
