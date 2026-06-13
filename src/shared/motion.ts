/**
 * Shared Framer Motion variants and spring configs.
 * All durations respect prefers-reduced-motion via MotionConfig in App.tsx.
 */

export const spring = {
  smooth:  { type: 'spring', stiffness: 400, damping: 35 },
  bouncy:  { type: 'spring', stiffness: 500, damping: 28 },
  slow:    { type: 'spring', stiffness: 280, damping: 32 },
} as const;

export const ease = {
  enter: [0.16, 1, 0.3, 1] as [number, number, number, number],
  exit:  [0.4, 0, 1, 1]    as [number, number, number, number],
} as const;

/** Page-level slide + fade transition */
export const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0,  transition: { duration: 0.28, ease: ease.enter } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18, ease: ease.exit  } },
};

/** Fade only — for content that shouldn't slide */
export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.22, ease: 'easeOut' as const } },
  exit:    { opacity: 0, transition: { duration: 0.14, ease: 'easeIn'  as const } },
};

/** Card entrance — used in staggered lists */
export const cardVariants = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: { opacity: 1, y: 0,  scale: 1,
    transition: { duration: 0.3, ease: ease.enter } },
};

/** Stagger container — wraps staggered children */
export const staggerContainer = (stagger = 0.05) => ({
  animate: { transition: { staggerChildren: stagger } },
});

/** Bottom sheet — slides up from off-screen */
export const sheetVariants = {
  initial: { y: '100%', opacity: 0.6 },
  animate: { y: 0, opacity: 1, transition: { ...spring.smooth } },
  exit:    { y: '100%', opacity: 0, transition: { duration: 0.22, ease: ease.exit } },
};

/** Backdrop fade */
export const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.18 } },
};
