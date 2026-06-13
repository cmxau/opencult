import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './Icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
}

const MAX_WIDTH: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Modal({ open, onClose, title, children, footer, size = 'md', ariaLabel }: ModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Focus management
  useEffect(() => {
    if (open && sheetRef.current) sheetRef.current.focus();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? title}
      className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in"
      style={{
        background:           'rgba(0,0,0,0.45)',
        backdropFilter:       'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding:              'max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))',
      }}
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${MAX_WIDTH[size]} mx-auto flex flex-col rounded-card outline-none animate-spring-in`}
        style={{
          maxHeight:            'calc(100dvh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
          background:           'var(--surface-strong)',
          backdropFilter:       'blur(36px) saturate(180%)',
          WebkitBackdropFilter: 'blur(36px) saturate(180%)',
          border:               '1px solid var(--glass-border)',
          boxShadow:            'var(--glass-shadow-lg)',
          color:                'var(--ink)',
        }}
      >
        {/* Header */}
        {title !== undefined && (
          <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
            {title && <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>{title}</h2>}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-90 ml-auto"
              style={{ background: 'var(--surface)', color: 'var(--ink)' }}
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 pt-3 pb-5 border-t" style={{ borderColor: 'var(--glass-border)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
