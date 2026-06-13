import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '@/features/users/UserContext';
import { useSettings } from '@/features/settings/SettingsContext';
import { CheckIcon, PlusIcon, SettingsIcon, UserIcon } from './Icons';
import type { User } from '@/shared/db/types';
import { getLatestMeasurementForUser } from '@/features/history/historyService';
import { formatWeight } from '@/shared/units';

function ageFromDob(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
}

interface ProfileSwitcherProps {
  onEditProfile?: (user: User) => void;
  onAddProfile?: () => void;
}

interface ProfileMeta {
  weightKg: number | null;
}

export function ProfileSwitcher({ onEditProfile, onAddProfile }: ProfileSwitcherProps) {
  const navigate = useNavigate();
  const { users, activeUser } = useUsers();
  const { settings, update } = useSettings();
  const [open, setOpen] = useState(false);
  const [meta, setMeta] = useState<Record<number, ProfileMeta>>({});
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (open && ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const entries: Record<number, ProfileMeta> = {};
      for (const u of users) {
        if (!u.id) continue;
        const latest = await getLatestMeasurementForUser(u.id);
        entries[u.id] = { weightKg: latest?.raw.weightKg ?? null };
      }
      if (!cancelled) setMeta(entries);
    })();
    return () => { cancelled = true; };
  }, [open, users]);

  async function switchTo(id: number | undefined) {
    if (!id) return;
    await update({ activeUserId: id });
    setOpen(false);
  }

  function handleAdd() {
    setOpen(false);
    onAddProfile?.();
  }

  function handleEdit() {
    setOpen(false);
    if (activeUser) onEditProfile?.(activeUser);
  }

  function handleSettings() {
    setOpen(false);
    navigate('/settings');
  }

  if (!activeUser) {
    return (
      <button
        onClick={() => navigate('/settings')}
        aria-label="No profile — open Settings"
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{ background: 'var(--surface-strong)', color: 'var(--ink-3)' }}
      >
        <UserIcon className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Active profile ${activeUser.name}. Open profile switcher.`}
        className="w-11 h-11 rounded-full flex items-center justify-center text-base font-semibold transition-transform active:scale-95"
        style={{ background: activeUser.avatarColor, color: '#11141A' }}
      >
        {activeUser.name[0].toUpperCase()}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-14 right-0 z-50 w-72 max-w-[calc(100vw-32px)] rounded-card overflow-hidden animate-spring-in"
          style={{
            background:           'var(--surface-strong)',
            backdropFilter:       'blur(36px) saturate(180%)',
            WebkitBackdropFilter: 'blur(36px) saturate(180%)',
            border:               '1px solid var(--glass-border)',
            boxShadow:            'var(--glass-shadow-lg)',
            color:                'var(--ink)',
          }}
        >
          {/* Active user header */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--glass-border)' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-base font-semibold"
                style={{ background: activeUser.avatarColor, color: '#11141A' }}
              >
                {activeUser.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>
                  {activeUser.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
                  Age {ageFromDob(activeUser.dob)}
                  {meta[activeUser.id!]?.weightKg !== undefined && meta[activeUser.id!]?.weightKg !== null && (
                    <> · {formatWeight(meta[activeUser.id!].weightKg!, settings.weightUnit)}</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Other profiles */}
          {users.length > 1 && (
            <div className="max-h-52 overflow-y-auto py-1">
              {users
                .filter(u => u.id !== activeUser.id)
                .map(u => (
                  <button
                    key={u.id}
                    role="menuitem"
                    onClick={() => switchTo(u.id)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--surface)] transition-colors text-left"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                      style={{ background: u.avatarColor, color: '#11141A' }}
                    >
                      {u.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{u.name}</p>
                      <p className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
                        Age {ageFromDob(u.dob)}
                        {u.id !== undefined && meta[u.id]?.weightKg !== undefined && meta[u.id]?.weightKg !== null && (
                          <> · {formatWeight(meta[u.id].weightKg!, settings.weightUnit)}</>
                        )}
                      </p>
                    </div>
                    <CheckIcon className="w-4 h-4" style={{ color: u.id === activeUser.id ? 'var(--brand-green)' : 'transparent' }} />
                  </button>
                ))}
            </div>
          )}

          {/* Actions */}
          <div className="border-t py-1" style={{ borderColor: 'var(--glass-border)' }}>
            <button
              role="menuitem"
              onClick={handleAdd}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--surface)] transition-colors text-left"
            >
              <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--surface)', color: 'var(--ink)' }}>
                <PlusIcon className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Add profile</span>
            </button>
            <button
              role="menuitem"
              onClick={handleEdit}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--surface)] transition-colors text-left"
            >
              <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--surface)', color: 'var(--ink)' }}>
                <UserIcon className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Edit profile</span>
            </button>
            <button
              role="menuitem"
              onClick={handleSettings}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--surface)] transition-colors text-left"
            >
              <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--surface)', color: 'var(--ink)' }}>
                <SettingsIcon className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Settings</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
