import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footerActions,
  size = 'md'
}) => {
  // Listen for Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-text/40 backdrop-blur-xs"
          />

          {/* Modal content container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            className={`
              relative w-full bg-white border border-brand-border rounded-xl shadow-xl overflow-hidden z-10 flex flex-col max-h-[90vh]
              ${sizes[size]}
            `}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between">
              <h3 className="font-semibold text-brand-text text-sm uppercase tracking-wide">
                {title}
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="!p-1 text-brand-muted hover:text-brand-text"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 overflow-y-auto flex-1 text-sm text-brand-text">
              {children}
            </div>

            {/* Footer */}
            {footerActions && (
              <div className="px-5 py-3 border-t border-brand-border bg-gray-50 flex items-center justify-end gap-3">
                {footerActions}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
