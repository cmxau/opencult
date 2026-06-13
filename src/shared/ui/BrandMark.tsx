import type { CSSProperties } from 'react';

interface BrandMarkProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * OpenCult wordmark + dot logo. Uses currentColor for text.
 */
export function BrandMark({ className = '', style }: BrandMarkProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`} style={style}>
      <span
        aria-hidden
        className="w-6 h-6 rounded-full relative flex items-center justify-center flex-shrink-0"
        style={{
          background: 'conic-gradient(from 220deg, var(--brand-teal), var(--brand-green), var(--brand-teal))',
        }}
      >
        <span
          aria-hidden
          className="absolute inset-1 rounded-full"
          style={{ background: 'var(--bg)', opacity: 0.85 }}
        />
        <span
          aria-hidden
          className="relative w-2 h-2 rounded-full"
          style={{ background: 'var(--ink)' }}
        />
      </span>
      <span
        className="text-lg font-bold tracking-tight"
        style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}
      >
        <span style={{ fontWeight: 700 }}>Open</span>
        <span style={{ fontWeight: 400, opacity: 0.65 }}>Cult</span>
      </span>
    </div>
  );
}
