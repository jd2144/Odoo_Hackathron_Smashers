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
          className="text-[10px] font-bold text-sahara-clay/90 uppercase tracking-widest pl-0.5"
        >
          {label}
        </label>
      )}
      
      <input
        id={inputId}
        type={type}
        ref={ref}
        className={`
          w-full px-4 py-2.5 text-sm bg-white/60 backdrop-blur-xs border rounded-xl transition-all duration-300 outline-none
          placeholder:text-sahara-clay/40 text-sahara-coffee
          ${error 
            ? 'border-sahara-danger focus:border-sahara-danger focus:ring-4 focus:ring-sahara-danger/10' 
            : 'border-sahara-sand/35 focus:border-sahara-gold focus:ring-4 focus:ring-sahara-gold/10'
          }
          disabled:bg-sahara-light/20 disabled:text-sahara-clay/40
          ${className}
        `}
        {...props}
      />
      
      {error && (
        <span className="text-xs text-sahara-danger font-semibold animate-fade-in pl-0.5">
          {error}
        </span>
      )}
      
      {!error && helperText && (
        <span className="text-xs text-sahara-clay/60 pl-0.5 leading-relaxed">
          {helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
