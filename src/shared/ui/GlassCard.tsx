import { motion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';

export type CardVariant = 'glass' | 'strong' | 'soft' | 'tintA' | 'tintB' | 'tintC';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: boolean;
  variant?: CardVariant;
  style?: CSSProperties;
  as?: 'div' | 'button' | 'section' | 'article';
  ariaLabel?: string;
}

const BG: Record<CardVariant, string> = {
  glass:  'var(--surface)',
  strong: 'var(--surface-strong)',
  soft:   'var(--surface-soft)',
  tintA:  'var(--surface-tint-a)',
  tintB:  'var(--surface-tint-b)',
  tintC:  'var(--surface-tint-c)',
};

const cardStyle = (variant: CardVariant, style?: CSSProperties): CSSProperties => ({
  background:              BG[variant],
  backdropFilter:          'blur(28px) saturate(160%)',
  WebkitBackdropFilter:    'blur(28px) saturate(160%)',
  border:                  '1px solid var(--glass-border)',
  boxShadow:               'var(--glass-shadow)',
  ...style,
});

export function GlassCard({
  children,
  className = '',
  onClick,
  padding = true,
  variant = 'glass',
  style,
  as = 'div',
  ariaLabel,
}: GlassCardProps) {
  const baseClass = `rounded-card relative overflow-hidden ${padding ? 'p-4' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`;

  const inner = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-card"
        style={{
          background: 'linear-gradient(180deg, var(--glass-edge), transparent 40%)',
          opacity: 0.55,
        }}
      />
      <div className="relative z-10">{children}</div>
    </>
  );

  if (onClick) {
    const MotionEl = motion[as === 'button' ? 'button' : 'div'] as typeof motion.div;
    return (
      <MotionEl
        onClick={onClick}
        aria-label={ariaLabel}
        className={baseClass}
        style={cardStyle(variant, style)}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {inner}
      </MotionEl>
    );
  }

  const Tag = as;
  return (
    <Tag
      aria-label={ariaLabel}
      className={baseClass}
      style={cardStyle(variant, style)}
    >
      {inner}
    </Tag>
  );
}
