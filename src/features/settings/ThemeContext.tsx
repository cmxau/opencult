import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSettings } from './SettingsContext';
import type { ThemeMode } from '@/shared/db/types';

interface ThemeCtx {
  mode:     ThemeMode;
  resolved: 'light' | 'dark';
  setMode:  (m: ThemeMode) => Promise<void>;
}

const Ctx = createContext<ThemeCtx>({
  mode:     'system',
  resolved: 'light',
  setMode:  async () => {},
});

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyResolved(resolved: 'light' | 'dark') {
  const root = document.documentElement;
  if (resolved === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#0B0E13' : '#EAF3F8');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings, update } = useSettings();
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolved: 'light' | 'dark' = useMemo(() => {
    if (settings.theme === 'system') return systemDark ? 'dark' : 'light';
    return settings.theme;
  }, [settings.theme, systemDark]);

  useEffect(() => { applyResolved(resolved); }, [resolved]);

  useEffect(() => {
    try { localStorage.setItem('oc_theme', settings.theme); } catch (_) {}
  }, [settings.theme]);

  const value: ThemeCtx = {
    mode:     settings.theme,
    resolved,
    setMode:  async (m) => { await update({ theme: m }); },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
