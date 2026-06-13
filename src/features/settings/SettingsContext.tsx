import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getSettings, updateSettings } from './settingsService';
import { DEFAULT_SETTINGS, type AppSettings } from '@/shared/db/types';

interface SettingsCtx {
  settings: AppSettings;
  update: (patch: Partial<Omit<AppSettings, 'id'>>) => Promise<void>;
}

const Ctx = createContext<SettingsCtx>({
  settings: DEFAULT_SETTINGS,
  update:   async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  async function update(patch: Partial<Omit<AppSettings, 'id'>>) {
    const next = await updateSettings(patch);
    setSettings(next);
  }

  return <Ctx.Provider value={{ settings, update }}>{children}</Ctx.Provider>;
}

export const useSettings = () => useContext(Ctx);
