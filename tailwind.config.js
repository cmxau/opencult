/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        ink:  'var(--ink)',
        ink2: 'var(--ink-2)',
        ink3: 'var(--ink-3)',
        bg:   'var(--bg)',
        accent:    'var(--accent)',
        'accent-on': 'var(--accent-on)',
        brand: {
          green: 'var(--brand-green)',
          teal:  'var(--brand-teal)',
        },
        status: {
          ok:    'var(--status-ok)',
          warn:  'var(--status-warn)',
          alert: 'var(--status-alert)',
          low:   'var(--status-low)',
        },
      },
      borderRadius: {
        card: '22px',
        pill: '999px',
      },
      boxShadow: {
        glass:    'var(--glass-shadow)',
        glassLg:  'var(--glass-shadow-lg)',
      },
      keyframes: {
        pulse_dot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.5', transform: 'scale(1.4)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        pulse_dot:  'pulse_dot 2s ease-in-out infinite',
        slideUp:    'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        slideDown:  'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
};
