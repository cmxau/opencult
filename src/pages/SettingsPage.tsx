import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams }       from 'react-router-dom';
import { useUsers }              from '@/features/users/UserContext';
import { useSettings }           from '@/features/settings/SettingsContext';
import {
  createUser, updateUser, deleteUser, AVATAR_COLORS,
} from '@/features/users/userService';
import {
  requestNotificationPermission, scheduleReminder, clearReminder,
} from '@/features/reminders/reminderService';
import { exportAllData, importAllData } from '@/features/history/historyService';
import { db }                    from '@/shared/db';
import { GlassCard }             from '@/shared/ui/GlassCard';
import { Modal }                 from '@/shared/ui/Modal';
import { ConfirmDialog }         from '@/shared/ui/ConfirmDialog';
import {
  CheckIcon, CloseIcon, PlusIcon, ScaleDeviceIcon, BellIcon, SparkleIcon,
  UserIcon, DownloadIcon, UploadIcon,
} from '@/shared/ui/Icons';
import {
  kgToLbs, lbsToKg, cmToFtIn, ftInToCm,
} from '@/shared/units';
import type {
  User, Device, WeightUnit, HeightUnit, Goals,
} from '@/shared/db/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary:   'Sedentary',
  light:       'Light',
  moderate:    'Moderate',
  active:      'Active',
  very_active: 'Very Active',
};

interface FormState {
  name:              string;
  sex:               string;
  dob:               string;
  heightCm:          string;        // canonical cm
  ftStr:             string;        // for ft input mode
  inStr:             string;
  weightUnit:        WeightUnit;
  heightUnit:        HeightUnit;
  activityLevel:     string;
  targetWeightVal:   string;        // input in user's unit
  avatarColor:       string;
  goalBodyFatPct:    string;
  goalWeeklyKg:      string;
}

export default function SettingsPage() {
  const [params, setParams]   = useSearchParams();
  const { users, activeUser, reload } = useUsers();
  const { settings, update }  = useSettings();

  const [showForm, setShowForm]         = useState(false);
  const [editUser, setEditUser]         = useState<User | null>(null);
  const [form, setForm]                 = useState<FormState>(blankForm(settings.weightUnit, settings.heightUnit));
  const [devices, setDevices]           = useState<Device[]>([]);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImportJson, setPendingImportJson] = useState<string | null>(null);
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<number | null>(null);
  const [pendingForgetDeviceId, setPendingForgetDeviceId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string, ok: boolean) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, ok });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => { db.devices.toArray().then(setDevices); }, []);

  /* Handle ?action= URL param from Home */
  useEffect(() => {
    const action = params.get('action');
    if (action === 'add-profile') {
      openNewUser();
      params.delete('action');
      setParams(params, { replace: true });
    } else if (action === 'edit-profile' && activeUser) {
      openEditUser(activeUser);
      params.delete('action');
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, activeUser]);

  function openNewUser() {
    setEditUser(null);
    const f = blankForm(settings.weightUnit, settings.heightUnit);
    f.avatarColor = AVATAR_COLORS[users.length % AVATAR_COLORS.length];
    setForm(f);
    setShowForm(true);
  }

  function openEditUser(u: User) {
    setEditUser(u);
    setForm({
      name:           u.name,
      sex:            u.sex,
      dob:            u.dob,
      heightCm:       String(u.heightCm),
      ftStr:          String(cmToFtIn(u.heightCm).ft),
      inStr:          String(cmToFtIn(u.heightCm).in),
      weightUnit:     settings.weightUnit,
      heightUnit:     settings.heightUnit,
      activityLevel:  u.activityLevel,
      targetWeightVal: settings.weightUnit === 'lbs'
                        ? kgToLbs(u.targetWeightKg).toFixed(1)
                        : u.targetWeightKg.toFixed(1),
      avatarColor:    u.avatarColor,
      goalBodyFatPct: String(u.goals?.targetBodyFatPct ?? (u.sex === 'male' ? 15 : 22)),
      goalWeeklyKg:   String(u.goals?.weeklyChangeRateKg ?? -0.5),
    });
    setShowForm(true);
  }

  const handleSaveUser = useCallback(async () => {
    if (!form.name.trim() || !form.dob) {
      alert('Please fill name and date of birth.');
      return;
    }
    const heightCm = form.heightUnit === 'ft'
      ? Math.round(ftInToCm(Number(form.ftStr || 0), Number(form.inStr || 0)))
      : Number(form.heightCm);
    if (!heightCm || heightCm < 80 || heightCm > 250) {
      alert('Please provide a valid height.');
      return;
    }
    const targetWeightKg = form.weightUnit === 'lbs'
      ? lbsToKg(Number(form.targetWeightVal || 0))
      : Number(form.targetWeightVal || 0);

    const goals: Goals = {
      targetWeightKg,
      targetBodyFatPct: Number(form.goalBodyFatPct || (form.sex === 'male' ? 15 : 22)),
      weeklyChangeRateKg: Number(form.goalWeeklyKg || 0),
    };

    const data = {
      name:           form.name.trim(),
      sex:            form.sex as User['sex'],
      dob:            form.dob,
      heightCm,
      activityLevel:  form.activityLevel as User['activityLevel'],
      targetWeightKg,
      avatarColor:    form.avatarColor,
      goals,
    };
    if (editUser) {
      await updateUser(editUser.id!, data);
    } else {
      const u = await createUser(data);
      if (users.length === 0) await update({ activeUserId: u.id });
    }
    await reload();
    setShowForm(false);
  }, [form, editUser, users, reload, update]);

  async function handleDeleteUser(id: number) {
    await deleteUser(id);
    if (settings.activeUserId === id) await update({ activeUserId: null });
    await reload();
    setPendingDeleteUserId(null);
  }

  async function handleReminderToggle(enabled: boolean) {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert('Notification permission denied.');
        return;
      }
      scheduleReminder(settings.reminderDayOfWeek, settings.reminderTimeHHMM);
    } else {
      clearReminder();
    }
    await update({ reminderEnabled: enabled });
  }

  async function handleExport() {
    const json = await exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `open-cult-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setPendingImportJson(text);
      setShowImportConfirm(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleConfirmImport() {
    if (!pendingImportJson) return;
    try {
      await importAllData(pendingImportJson);
      await update({ activeUserId: null });
      await reload();
      setShowImportConfirm(false);
      setPendingImportJson(null);
      showToast('Import successful — all data restored.', true);
    } catch {
      setShowImportConfirm(false);
      setPendingImportJson(null);
      showToast('Import failed: invalid or corrupt backup file.', false);
    }
  }

  async function handleForgetDevice(id: number) {
    await db.devices.delete(id);
    setDevices(prev => prev.filter(d => d.id !== id));
    setPendingForgetDeviceId(null);
  }

  return (
    <div className="flex flex-col gap-6 px-5 pt-12 pb-32 max-w-lg mx-auto w-full">
      <div>
        <p className="text-sm" style={{ color: 'var(--ink-2)' }}>Settings</p>
        <h1 className="text-3xl font-bold leading-tight" style={{ color: 'var(--ink)' }}>Preferences</h1>
      </div>

      {/* Profiles */}
      <section>
        <SectionHeading icon={<UserIcon className="w-4 h-4" />} title="Profiles" />
        <div className="flex flex-col gap-2 mt-3">
          {users.map(u => (
            <GlassCard key={u.id}>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                  style={{ background: u.avatarColor, color: '#11141A' }}>
                  {u.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>{u.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--ink-3)' }}>
                    {ACTIVITY_LABELS[u.activityLevel]} · {u.heightCm} cm
                    {settings.activeUserId === u.id && ' · Active'}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => update({ activeUserId: u.id })}
                    aria-label="Set active"
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                      background: settings.activeUserId === u.id ? 'var(--accent)' : 'var(--surface)',
                      color:      settings.activeUserId === u.id ? 'var(--accent-on)' : 'var(--ink)',
                    }}
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditUser(u)}
                    aria-label="Edit profile"
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--surface)', color: 'var(--ink)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.06 2.06 0 1 1 2.915 2.914L7.5 18.677 3 20l1.323-4.5 12.539-12.013Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setPendingDeleteUserId(u.id!)}
                    aria-label="Delete profile"
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                      background: 'color-mix(in srgb, var(--status-alert) 14%, transparent)',
                      color: 'var(--status-alert)',
                    }}
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}

          {users.length < 10 && (
            <button
              onClick={openNewUser}
              className="w-full py-3.5 rounded-card flex items-center justify-center gap-2 text-sm font-medium border-2 border-dashed transition-colors"
              style={{
                borderColor: 'var(--glass-border)',
                color:       'var(--ink-2)',
                background:  'var(--surface-soft)',
              }}
            >
              <PlusIcon className="w-4 h-4" /> Add profile
            </button>
          )}
        </div>
      </section>

      {/* Units */}
      <section>
        <SectionHeading title="Units" />
        <GlassCard className="mt-3">
          <div className="flex flex-col gap-3">
            <UnitToggle label="Weight"
              options={[{ key: 'kg', label: 'KG' }, { key: 'lbs', label: 'LBS' }]}
              value={settings.weightUnit}
              onChange={(v) => update({ weightUnit: v as WeightUnit })} />
            <UnitToggle label="Height"
              options={[{ key: 'cm', label: 'CM' }, { key: 'ft', label: 'FT/IN' }]}
              value={settings.heightUnit}
              onChange={(v) => update({ heightUnit: v as HeightUnit })} />
          </div>
        </GlassCard>
      </section>

      {/* Display */}
      <section>
        <SectionHeading title="Display" />
        <GlassCard className="mt-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Advanced metrics</p>
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--ink-3)' }}>
                Shows FFMI on the home overview
              </p>
            </div>
            <Toggle
              checked={!!settings.showAdvancedMetrics}
              onChange={v => update({ showAdvancedMetrics: v })}
            />
          </div>
        </GlassCard>
      </section>

      {/* Device */}
      <section>
        <SectionHeading icon={<ScaleDeviceIcon className="w-4 h-4" />} title="Scale device" />
        <div className="flex flex-col gap-2 mt-3">
          {devices.length === 0 ? (
            <GlassCard>
              <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
                No device saved. It will be paired automatically when you measure.
              </p>
            </GlassCard>
          ) : (
            devices.map(d => (
              <GlassCard key={d.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>{d.name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--ink-3)' }}>
                      {d.macAddress || '—'} · Last seen {new Date(d.lastConnectedAt).toLocaleDateString()}
                      {d.batteryPct != null && ` · ${d.batteryPct}%`}
                    </p>
                  </div>
                  <button
                    onClick={() => setPendingForgetDeviceId(d.id!)}
                    className="flex-shrink-0 px-3 h-9 rounded-pill text-xs font-medium"
                    style={{
                      background: 'color-mix(in srgb, var(--status-alert) 14%, transparent)',
                      color:      'var(--status-alert)',
                    }}
                  >
                    Forget
                  </button>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </section>

      {/* Reminders */}
      <section>
        <SectionHeading icon={<BellIcon className="w-4 h-4" />} title="Reminders" />
        <GlassCard className="mt-3">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Weekly reminder</span>
              <Toggle checked={settings.reminderEnabled} onChange={handleReminderToggle} />
            </div>

            {settings.reminderEnabled && (
              <>
                <div>
                  <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--ink-3)' }}>Day</p>
                  <div className="flex gap-1.5">
                    {DAYS.map((d, i) => {
                      const active = settings.reminderDayOfWeek === i;
                      return (
                        <button
                          key={d}
                          onClick={() => update({ reminderDayOfWeek: i })}
                          className="flex-1 py-2 rounded-pill text-[11px] font-semibold"
                          style={{
                            background: active ? 'var(--accent)' : 'var(--surface)',
                            color:      active ? 'var(--accent-on)' : 'var(--ink-2)',
                          }}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--ink-3)' }}>Time</p>
                  <input
                    type="time"
                    value={settings.reminderTimeHHMM}
                    onChange={e => update({ reminderTimeHHMM: e.target.value })}
                    className="text-base font-medium rounded-pill px-4 py-2 outline-none"
                    style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--glass-border)' }}
                  />
                </div>
              </>
            )}
          </div>
        </GlassCard>
      </section>

      {/* OpenAI */}
      <section>
        <SectionHeading icon={<SparkleIcon className="w-4 h-4" />} title="OpenAI" />
        <GlassCard className="mt-3">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider block mb-2" style={{ color: 'var(--ink-3)' }}>
                API key
              </label>
              <input
                type="password"
                value={settings.openAIKey}
                onChange={e => update({ openAIKey: e.target.value })}
                placeholder="sk-..."
                autoComplete="off"
                className="w-full text-sm rounded-pill px-4 py-2 outline-none border placeholder:opacity-60"
                style={{
                  background:  'var(--surface)',
                  color:       'var(--ink)',
                  borderColor: 'var(--glass-border)',
                }}
              />
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--ink-3)' }}>Stored locally on this device only.</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--ink-3)' }}>Model</p>
              <div className="flex gap-2">
                {(['gpt-4o-mini', 'gpt-4o'] as const).map(m => {
                  const active = settings.openAIModel === m;
                  return (
                    <button
                      key={m}
                      onClick={() => update({ openAIModel: m })}
                      className="flex-1 py-2.5 rounded-pill text-xs font-semibold"
                      style={{
                        background: active ? 'var(--accent)' : 'var(--surface)',
                        color:      active ? 'var(--accent-on)' : 'var(--ink-2)',
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Data — Backup */}
      <section>
        <SectionHeading icon={<DownloadIcon className="w-4 h-4" />} title="Backup" />
        <GlassCard className="mt-3">
          <div className="flex flex-col gap-5">
            {/* Auto-export row */}
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Auto-export daily</p>
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--ink-3)' }}>
                  Downloads <code>open-cult-backup.json</code> on first open at or after the set time
                </p>
              </div>
              <Toggle
                checked={!!settings.autoExportEnabled}
                onChange={v => update({ autoExportEnabled: v })}
              />
            </div>

            {settings.autoExportEnabled && (
              <div className="flex items-center gap-3">
                <p className="text-[11px] uppercase tracking-wider flex-shrink-0" style={{ color: 'var(--ink-3)' }}>Time</p>
                <input
                  type="time"
                  value={settings.autoExportTime || '06:00'}
                  onChange={e => update({ autoExportTime: e.target.value })}
                  className="text-sm font-medium rounded-pill px-4 py-2 outline-none"
                  style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--glass-border)' }}
                />
              </div>
            )}

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--glass-border)' }} />

            {/* Manual export */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Export now</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-3)' }}>Download full backup as JSON</p>
              </div>
              <button
                onClick={handleExport}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-pill text-sm font-semibold transition-transform active:scale-[0.97]"
                style={{
                  background: 'var(--surface-strong)',
                  color:      'var(--ink)',
                  border:     '1px solid var(--glass-border)',
                }}
              >
                <DownloadIcon className="w-4 h-4" /> Export
              </button>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Data — Restore */}
      <section>
        <SectionHeading icon={<UploadIcon className="w-4 h-4" />} title="Restore" />
        <GlassCard className="mt-3"
          style={{ border: '1px solid color-mix(in srgb, var(--status-warn) 30%, var(--glass-border))' }}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: 'color-mix(in srgb, var(--status-warn) 15%, transparent)',
                  color: 'var(--status-warn)',
                }}
              >
                <UploadIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Import backup</p>
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--ink-3)' }}>
                  Replaces all profiles and measurements with the selected JSON file. Cannot be undone.
                </p>
              </div>
            </div>
            <button
              onClick={() => importFileRef.current?.click()}
              className="w-full py-3 rounded-pill text-sm font-semibold flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              style={{
                background: 'color-mix(in srgb, var(--status-warn) 14%, transparent)',
                color:      'var(--status-warn)',
                border:     '1px solid color-mix(in srgb, var(--status-warn) 28%, transparent)',
              }}
            >
              Choose file &amp; restore
            </button>
            <input
              ref={importFileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImportFileChange}
            />
          </div>
        </GlassCard>
      </section>

      {/* Feedback */}
      <section>
        <SectionHeading title="Feedback" />
        <GlassCard className="mt-3">
          <div className="flex flex-col gap-1">
            <a
              href="https://github.com/cmxau/open-cult/issues/new?labels=feature+request&template=feature_request.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-1 py-2.5 rounded-xl transition-colors active:opacity-70"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--surface-tint-a)' }}>
                  <svg fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" className="w-4 h-4" style={{ color: 'var(--brand-green)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Request a feature</span>
              </div>
              <svg fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" className="w-4 h-4" style={{ color: 'var(--ink-3)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
              </svg>
            </a>

            <div style={{ height: 1, background: 'var(--glass-border)' }} />

            <a
              href="https://github.com/cmxau/open-cult/issues/new?labels=bug&template=bug_report.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-1 py-2.5 rounded-xl transition-colors active:opacity-70"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'color-mix(in srgb, var(--status-alert) 12%, transparent)' }}>
                  <svg fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" className="w-4 h-4" style={{ color: 'var(--status-alert)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 1 0 0 18A9 9 0 0 0 12 3Z" />
                  </svg>
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Report a bug</span>
              </div>
              <svg fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" className="w-4 h-4" style={{ color: 'var(--ink-3)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
              </svg>
            </a>
          </div>
        </GlassCard>
      </section>

      {/* Footer */}
      <div className="flex flex-col items-center gap-1 pt-2 pb-2">
        <p className="text-[11px]" style={{ color: 'var(--ink-3)' }}>Designed and developed by</p>
        <a
          href="https://github.com/cmxau"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold transition-opacity active:opacity-60"
          style={{ color: 'var(--ink-2)' }}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"/>
          </svg>
          cmxau
        </a>
      </div>

      <ConfirmDialog
        open={showImportConfirm}
        title="Replace all data?"
        message="This will overwrite all existing profiles and measurements with the contents of the backup file. This cannot be undone."
        confirmLabel="Replace"
        destructive
        onConfirm={handleConfirmImport}
        onCancel={() => { setShowImportConfirm(false); setPendingImportJson(null); }}
      />

      <ConfirmDialog
        open={pendingDeleteUserId !== null}
        title="Delete profile?"
        message="This will permanently delete this profile and all its measurements. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => pendingDeleteUserId !== null && handleDeleteUser(pendingDeleteUserId)}
        onCancel={() => setPendingDeleteUserId(null)}
      />

      <ConfirmDialog
        open={pendingForgetDeviceId !== null}
        title="Forget device?"
        message="The scale will need to be paired again the next time you measure."
        confirmLabel="Forget"
        destructive
        onConfirm={() => pendingForgetDeviceId !== null && handleForgetDevice(pendingForgetDeviceId)}
        onCancel={() => setPendingForgetDeviceId(null)}
      />

      {/* Profile form modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editUser ? 'Edit profile' : 'New profile'}
        size="md"
        footer={(
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-3 rounded-pill text-sm font-medium"
              style={{ background: 'var(--surface)', color: 'var(--ink)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveUser}
              className="flex-1 py-3 rounded-pill text-sm font-semibold"
              style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
            >
              Save
            </button>
          </div>
        )}
      >
        <div className="flex flex-col gap-4 py-2">
          <FormField label="Name">
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Chinmay"
              className="modal-input"
            />
          </FormField>

          <FormField label="Date of birth">
            <input
              type="date"
              value={form.dob}
              onChange={e => setForm(p => ({ ...p, dob: e.target.value }))}
              className="modal-input"
            />
          </FormField>

          <FormField label="Sex">
            <div className="flex gap-2">
              {['male', 'female'].map(s => {
                const active = form.sex === s;
                return (
                  <button
                    key={s}
                    onClick={() => setForm(p => ({ ...p, sex: s }))}
                    className="flex-1 py-2.5 rounded-pill text-sm font-semibold capitalize"
                    style={{
                      background: active ? 'var(--accent)' : 'var(--surface)',
                      color:      active ? 'var(--accent-on)' : 'var(--ink-2)',
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </FormField>

          {/* Height with unit toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>Height</span>
              <UnitInline
                value={form.heightUnit}
                options={['cm', 'ft']}
                onChange={(v) => setForm(p => ({ ...p, heightUnit: v as HeightUnit }))}
              />
            </div>
            {form.heightUnit === 'cm' ? (
              <input
                type="number"
                value={form.heightCm}
                onChange={e => setForm(p => ({ ...p, heightCm: e.target.value }))}
                placeholder="175"
                className="modal-input"
              />
            ) : (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={form.ftStr}
                  onChange={e => setForm(p => ({ ...p, ftStr: e.target.value }))}
                  placeholder="5"
                  className="modal-input flex-1"
                />
                <input
                  type="number"
                  value={form.inStr}
                  onChange={e => setForm(p => ({ ...p, inStr: e.target.value }))}
                  placeholder="9"
                  className="modal-input flex-1"
                />
              </div>
            )}
          </div>

          {/* Target weight */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>Target weight</span>
              <UnitInline
                value={form.weightUnit}
                options={['kg', 'lbs']}
                onChange={(v) => {
                  setForm(p => {
                    const numVal = Number(p.targetWeightVal || 0);
                    let converted = numVal;
                    if (p.weightUnit === 'kg' && v === 'lbs') converted = kgToLbs(numVal);
                    if (p.weightUnit === 'lbs' && v === 'kg') converted = lbsToKg(numVal);
                    return { ...p, weightUnit: v as WeightUnit, targetWeightVal: converted.toFixed(1) };
                  });
                }}
              />
            </div>
            <input
              type="number"
              step="0.1"
              value={form.targetWeightVal}
              onChange={e => setForm(p => ({ ...p, targetWeightVal: e.target.value }))}
              placeholder={form.weightUnit === 'lbs' ? '154' : '70'}
              className="modal-input"
            />
          </div>

          <FormField label="Activity level">
            <select
              value={form.activityLevel}
              onChange={e => setForm(p => ({ ...p, activityLevel: e.target.value }))}
              className="modal-input"
            >
              {Object.entries(ACTIVITY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Target body fat %">
            <input
              type="number"
              step="0.5"
              value={form.goalBodyFatPct}
              onChange={e => setForm(p => ({ ...p, goalBodyFatPct: e.target.value }))}
              placeholder="15"
              className="modal-input"
            />
          </FormField>

          <FormField label="Weekly target change (kg)">
            <input
              type="number"
              step="0.1"
              value={form.goalWeeklyKg}
              onChange={e => setForm(p => ({ ...p, goalWeeklyKg: e.target.value }))}
              placeholder="-0.5 (loss) / +0.2 (gain)"
              className="modal-input"
            />
          </FormField>

          <FormField label="Avatar colour">
            <div className="flex gap-2 flex-wrap">
              {AVATAR_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setForm(p => ({ ...p, avatarColor: c }))}
                  aria-label={`Colour ${c}`}
                  className="w-9 h-9 rounded-full transition-transform"
                  style={{
                    background: c,
                    border:     form.avatarColor === c ? '3px solid var(--ink)' : '3px solid transparent',
                    transform:  form.avatarColor === c ? 'scale(1.05)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </FormField>
        </div>

        <style>{`
          .modal-input {
            width: 100%;
            background: var(--surface);
            border: 1px solid var(--glass-border);
            border-radius: 999px;
            padding: 10px 16px;
            color: var(--ink);
            font-size: 14px;
            outline: none;
          }
          .modal-input::placeholder { color: var(--ink-3); }
        `}</style>
      </Modal>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed top-14 inset-x-0 z-50 flex justify-center px-5"
            style={{ pointerEvents: 'none' }}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-pill text-sm font-semibold"
              style={{
                background:           toast.ok
                  ? `color-mix(in srgb, var(--status-ok) 18%, var(--surface-strong))`
                  : `color-mix(in srgb, var(--status-alert) 18%, var(--surface-strong))`,
                color:                toast.ok ? 'var(--status-ok)' : 'var(--status-alert)',
                border:               `1px solid ${toast.ok
                  ? 'color-mix(in srgb, var(--status-ok) 30%, transparent)'
                  : 'color-mix(in srgb, var(--status-alert) 30%, transparent)'}`,
                backdropFilter:       'blur(24px) saturate(160%)',
                WebkitBackdropFilter: 'blur(24px) saturate(160%)',
                boxShadow:            'var(--glass-shadow-lg)',
              }}
            >
              {toast.ok
                ? <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="m5 12 5 5 9-11" /></svg>
                : <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 1 0 0 18A9 9 0 0 0 12 3Z" /></svg>
              }
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function blankForm(weightUnit: WeightUnit, heightUnit: HeightUnit): FormState {
  return {
    name: '', sex: 'male', dob: '',
    heightCm: '', ftStr: '', inStr: '',
    weightUnit, heightUnit,
    activityLevel: 'moderate',
    targetWeightVal: '',
    avatarColor: AVATAR_COLORS[0],
    goalBodyFatPct: '15',
    goalWeeklyKg:  '-0.5',
  };
}

function SectionHeading({ icon, title }: { icon?: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon && <span style={{ color: 'var(--ink-2)' }}>{icon}</span>}
      <h2 className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--ink-3)' }}>{title}</h2>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-12 h-7 rounded-pill relative transition-colors flex-shrink-0 outline-none"
      style={{
        background: checked ? 'var(--accent)' : 'rgba(120,120,120,0.45)',
      }}
    >
      <span
        className="absolute top-1 w-5 h-5 rounded-full transition-all duration-200"
        style={{
          left: checked ? '24px' : '4px',
          background: checked ? 'var(--accent-on)' : '#ffffff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        }}
      />
    </button>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--ink-3)' }}>{label}</p>
      {children}
    </div>
  );
}

function UnitInline({ value, options, onChange }: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-pill p-0.5" style={{ background: 'var(--surface)' }}>
      {options.map(o => {
        const active = value === o;
        return (
          <button
            key={o}
            onClick={() => onChange(o)}
            className="px-3 py-0.5 rounded-pill text-[10px] uppercase font-semibold"
            style={{
              background: active ? 'var(--accent)' : 'transparent',
              color:      active ? 'var(--accent-on)' : 'var(--ink-3)',
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function UnitToggle({ label, options, value, onChange }: {
  label: string;
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 min-w-0">
      <span className="text-sm font-medium flex-shrink-0" style={{ color: 'var(--ink)' }}>{label}</span>
      <div className="flex rounded-pill p-0.5 flex-shrink-0" style={{ background: 'var(--surface-strong)' }}>
        {options.map(o => {
          const active = value === o.key;
          return (
            <button
              key={o.key}
              onClick={() => onChange(o.key)}
              className="px-3 py-1.5 rounded-pill text-[11px] font-semibold whitespace-nowrap"
              style={{
                background: active ? 'var(--accent)' : 'transparent',
                color:      active ? 'var(--accent-on)' : 'var(--ink-2)',
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
