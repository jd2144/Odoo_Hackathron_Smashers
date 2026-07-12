import * as React from 'react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`bg-white/80 backdrop-blur-md border border-sahara-sand/20 rounded-[20px] shadow-lg shadow-sahara-clay/5 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-sahara-clay/8 hover:border-sahara-sand/30 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`px-6 py-5 border-b border-sahara-sand/15 bg-gradient-to-r from-sahara-cream/40 to-transparent flex flex-col gap-1.5 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <h3 
      className={`text-xs font-bold text-sahara-coffee tracking-widest uppercase font-sans ${className}`} 
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p 
      className={`text-xs text-sahara-clay/80 font-sans leading-relaxed ${className}`} 
      {...props}
    >
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`p-6 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`px-6 py-4 border-t border-sahara-sand/15 bg-sahara-light/20 flex items-center justify-between gap-3 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};
