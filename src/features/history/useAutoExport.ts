import { useEffect } from 'react';
import { exportAllData } from './historyService';
import type { AppSettings } from '@/shared/db/types';

const LAST_EXPORT_KEY = 'open-cult-last-auto-export';

export function useAutoExport(settings: AppSettings) {
  useEffect(() => {
    if (!settings.autoExportEnabled) return;

    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(LAST_EXPORT_KEY) === today) return;

    const now = new Date();
    const [h, m] = (settings.autoExportTime || '06:00').split(':').map(Number);
    const scheduled = new Date();
    scheduled.setHours(h, m, 0, 0);
    if (now < scheduled) return;

    exportAllData().then(json => {
      const blob = new Blob([json], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'open-cult-backup.json';
      a.click();
      URL.revokeObjectURL(url);
      localStorage.setItem(LAST_EXPORT_KEY, today);
    });
  // Run once when settings load — not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.autoExportEnabled, settings.autoExportTime]);
}
