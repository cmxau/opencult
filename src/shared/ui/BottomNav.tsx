import { NavLink } from 'react-router-dom';
import type { CSSProperties } from 'react';

const TABS = [
  { to: '/',         icon: HomeIcon,  label: 'Home'     },
  { to: '/history',  icon: ChartIcon, label: 'Trends'   },
  { to: '/measure',  icon: ScaleIcon, label: 'Measure'  },
  { to: '/chat',     icon: ChatIcon,  label: 'Chat'     },
  { to: '/settings', icon: GearIcon,  label: 'Settings' },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-2 rounded-pill"
      style={{
        bottom:               'max(16px, env(safe-area-inset-bottom))',
        background:           'var(--surface)',
        backdropFilter:       'blur(36px) saturate(180%)',
        WebkitBackdropFilter: 'blur(36px) saturate(180%)',
        border:               '1px solid var(--glass-border)',
        boxShadow:            'var(--glass-shadow-lg)',
      }}
    >
      {TABS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          aria-label={label}
          className="flex items-center justify-center"
        >
          {({ isActive }) => (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                background: isActive ? 'var(--accent)' : 'transparent',
                color:      isActive ? 'var(--accent-on)' : 'var(--ink)',
              }}
            >
              <Icon className="w-5 h-5" />
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function HomeIcon({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function ChartIcon({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17V7l4 5 4-3 4 4 6-8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18" />
    </svg>
  );
}

function ScaleIcon({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="16" rx="3" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9h8M9 12h6" />
      <circle cx="12" cy="15.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

function ChatIcon({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12a8 8 0 1 1-3.06-6.3 8 8 0 0 1 3.06 6.3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11h.01M12 11h.01M16 11h.01M20 12l1 3-3-1" />
    </svg>
  );
}

function GearIcon({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.26.604.852 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.659 0-1.25.396-1.51 1Z" />
    </svg>
  );
}
