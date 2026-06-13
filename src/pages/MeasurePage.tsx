import { useState }                from 'react';
import { useNavigate }             from 'react-router-dom';
import { useBluetooth }            from '@/features/bluetooth/useBluetooth';
import { computeDerivedMetrics }   from '@/features/metrics';
import { computeRawFromScale }     from '@/features/metrics/computeFromScale';
import { saveMeasurement }         from '@/features/history/historyService';
import { useUsers }                from '@/features/users/UserContext';
import { useSettings }             from '@/features/settings/SettingsContext';
import { GlassCard }               from '@/shared/ui/GlassCard';
import { BluetoothIcon, ScaleDeviceIcon, HeartIcon, PulseIcon, CheckIcon, CloseIcon } from '@/shared/ui/Icons';
import { formatWeightValue, weightUnitLabel } from '@/shared/units';

type StateKey = 'idle' | 'scanning' | 'connecting' | 'measuring' | 'complete' | 'error';

const STATE_LABEL: Record<StateKey, string> = {
  idle:       'Step on scale',
  scanning:   'Scanning…',
  connecting: 'Connecting…',
  measuring:  'Measuring…',
  complete:   'Done',
  error:      'Step on scale',
};

export default function MeasurePage() {
  const navigate               = useNavigate();
  const { activeUser }         = useUsers();
  const { settings }           = useSettings();
  const { bleState, connect, disconnect } = useBluetooth();
  const [notes, setNotes]      = useState('');
  const [saving, setSaving]    = useState(false);

  const canSave =
    bleState.state === 'complete' &&
    activeUser != null &&
    bleState.scaleData.weightKg !== null;

  async function handleSave() {
    if (!activeUser || !canSave) return;
    setSaving(true);
    try {
      const raw     = computeRawFromScale(
        {
          weightKg:      bleState.scaleData.weightKg!,
          impedanceOhms: bleState.scaleData.impedanceOhms,
          heartRateBpm:  bleState.scaleData.heartRateBpm,
        },
        activeUser,
      );
      const derived = computeDerivedMetrics(raw, activeUser);
      await saveMeasurement(activeUser.id!, raw, derived, notes || null);
      disconnect();
      navigate('/');
    } finally {
      setSaving(false);
    }
  }

  const state = bleState.state as StateKey;
  const unit  = weightUnitLabel(settings.weightUnit);

  return (
    <div className="flex flex-col gap-5 px-5 pt-12 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: 'var(--ink-2)' }}>Measure</p>
          <h1 className="text-3xl font-bold leading-tight" style={{ color: 'var(--ink)' }}>
            {STATE_LABEL[state]}
          </h1>
        </div>
        <button
          onClick={() => navigate('/')}
          aria-label="Close"
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--glass-border)' }}
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

      {!activeUser && (
        <GlassCard>
          <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
            No active profile. Set one in Settings first.
          </p>
        </GlassCard>
      )}

      {activeUser && (
        <>
          <GlassCard className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
              style={{ background: activeUser.avatarColor, color: '#11141A' }}>
              {activeUser.name[0]}
            </div>
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>Measuring for</p>
              <p className="text-base font-medium" style={{ color: 'var(--ink)' }}>{activeUser.name}</p>
            </div>
          </GlassCard>

          {/* States */}
          {state === 'idle' && (
            <GlassCard className="flex flex-col items-center text-center py-10">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'var(--surface-tint-b)' }}>
                <BluetoothIcon className="w-10 h-10" style={{ color: 'var(--ink)' }} />
              </div>
              <p className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Connect to your scale</p>
              <p className="text-sm mt-1 mb-6 max-w-[260px]" style={{ color: 'var(--ink-2)' }}>
                Power on the Cult Smart Scale and tap below to scan.
              </p>
              <button
                onClick={() => connect()}
                className="w-full max-w-xs py-3.5 rounded-pill text-sm font-semibold transition-transform active:scale-[0.98]"
                style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
              >
                Scan for device
              </button>
            </GlassCard>
          )}

          {(state === 'scanning' || state === 'connecting') && (
            <GlassCard className="flex flex-col items-center text-center py-12">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 animate-pulse_dot"
                style={{ background: 'var(--surface-tint-b)' }}>
                <ScaleDeviceIcon className="w-10 h-10" style={{ color: 'var(--ink)' }} />
              </div>
              <p className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
                {state === 'scanning' ? 'Scanning for scale…' : `Connecting to ${bleState.deviceName ?? 'device'}…`}
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--ink-2)' }}>Make sure Bluetooth is on.</p>
            </GlassCard>
          )}

          {state === 'measuring' && (
            <GlassCard variant="tintA" className="text-center py-10">
              <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--ink-2)' }}>Live weight</p>
              <p className="text-7xl font-bold leading-none tabular-nums" style={{ color: 'var(--ink)' }}>
                {bleState.liveWeight !== null ? formatWeightValue(bleState.liveWeight, settings.weightUnit) : '--.-'}
              </p>
              <p className="text-base mt-2" style={{ color: 'var(--ink-2)' }}>{unit}</p>
              <p className="text-sm mt-6 max-w-[260px] mx-auto" style={{ color: 'var(--ink)' }}>
                Stand still — body analysis takes about 5 seconds.
              </p>
            </GlassCard>
          )}

          {state === 'complete' && (
            <>
              <GlassCard variant="tintA">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-2)' }}>Measurement done</p>
                    <p className="text-5xl font-bold mt-1 tabular-nums leading-none" style={{ color: 'var(--ink)' }}>
                      {bleState.scaleData.weightKg !== null ? formatWeightValue(bleState.scaleData.weightKg, settings.weightUnit) : '--.-'}
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'var(--ink-2)' }}>{unit}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--surface-strong)' }}>
                    <CheckIcon className="w-5 h-5" style={{ color: 'var(--ink)' }} />
                  </div>
                </div>
                <div className="flex gap-3 text-xs pt-3 border-t" style={{ borderColor: 'var(--glass-border)', color: 'var(--ink-2)' }}>
                  {bleState.scaleData.impedanceOhms && (
                    <div className="flex items-center gap-1.5">
                      <PulseIcon className="w-3.5 h-3.5" />
                      <span>Impedance {bleState.scaleData.impedanceOhms} Ω</span>
                    </div>
                  )}
                  {bleState.scaleData.heartRateBpm && (
                    <div className="flex items-center gap-1.5">
                      <HeartIcon className="w-3.5 h-3.5" />
                      <span>{bleState.scaleData.heartRateBpm} bpm</span>
                    </div>
                  )}
                  {!bleState.scaleData.impedanceOhms && !bleState.scaleData.heartRateBpm && (
                    <span>All other metrics computed on save</span>
                  )}
                </div>
              </GlassCard>

              <GlassCard>
                <label htmlFor="notes" className="text-[11px] uppercase tracking-wider block mb-2" style={{ color: 'var(--ink-3)' }}>
                  Add a note (optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. post-workout, fasted"
                  rows={2}
                  className="w-full bg-transparent text-sm outline-none resize-none"
                  style={{ color: 'var(--ink)' }}
                />
              </GlassCard>

              <div className="flex gap-3 mt-1">
                <button
                  onClick={disconnect}
                  className="flex-1 py-3.5 rounded-pill text-sm font-medium transition-transform active:scale-[0.98]"
                  style={{
                    background: 'var(--surface)',
                    color:      'var(--ink)',
                    border:     '1px solid var(--glass-border)',
                  }}
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3.5 rounded-pill text-sm font-semibold transition-transform active:scale-[0.98] disabled:opacity-50"
                  style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </>
          )}

          {state === 'error' && (
            <GlassCard className="text-center py-8">
              <p className="text-base font-semibold mb-1" style={{ color: 'var(--status-alert)' }}>Connection failed</p>
              <p className="text-sm mb-5" style={{ color: 'var(--ink-2)' }}>{bleState.error}</p>
              <button
                onClick={() => connect()}
                className="px-6 py-3 rounded-pill text-sm font-semibold"
                style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
              >
                Try again
              </button>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}
