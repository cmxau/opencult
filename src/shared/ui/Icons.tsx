/**
 * Centralised icon library.
 * Stroke 1.6, viewBox 24x24, currentColor.
 */
import type { CSSProperties } from 'react';

type IconProps = { className?: string; style?: CSSProperties };

const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, viewBox: '0 0 24 24' } as const;
const round = { strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function HeartIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path {...round} d="M11.645 20.91a.75.75 0 0 0 .71 0l.003-.002.012-.007.044-.025a25.633 25.633 0 0 0 4.244-3.17C18.682 15.91 21 12.97 21 9.5 21 6.45 18.42 4 15.39 4c-1.42 0-2.83.62-3.39 1.5C11.44 4.62 10.03 4 8.61 4 5.58 4 3 6.45 3 9.5c0 3.47 2.32 6.41 4.342 8.205a25.65 25.65 0 0 0 4.247 3.171l.044.025.012.007.003.002Z" />
    </svg>
  );
}

export function PulseIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path {...round} d="M3 12h3l2-6 4 12 2-6h7" />
    </svg>
  );
}

export function DropletIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path {...round} d="M12 2.5s6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 6-11 6-11Z" />
    </svg>
  );
}

export function BoneIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path {...round} d="M16 2.5a2.5 2.5 0 0 1 2.5 2.5c0 .91-.49 1.71-1.22 2.14.34.65.52 1.39.51 2.13 0 1.04-.36 2-.96 2.79l-3 4.07a2.5 2.5 0 0 1-3.85.18l-2-2.36-.18-.21a2.5 2.5 0 0 1-3.06-3.85l4.07-3a4.96 4.96 0 0 1 4.92-.45c.43-.73 1.23-1.22 2.14-1.22A2.5 2.5 0 0 1 16 2.5Z" />
    </svg>
  );
}

export function MuscleIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path {...round} d="M17.5 7c0-2.21-1.79-4-4-4-1.44 0-2.7.76-3.4 1.89A4 4 0 0 0 4 8.5c0 1.39.7 2.6 1.77 3.32L5 14l2 3 1.5-1 1 2.5L11 17l3 4 4-2-3-5c3.5-.5 4.5-2 4.5-4 0-1.39-.7-2.6-1.77-3.32A3.96 3.96 0 0 0 17.5 7Z" />
    </svg>
  );
}

export function FireIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path {...round} d="M12 2.5s.5 3 2.5 5.5 4 4 4 7a6.5 6.5 0 1 1-13 0c0-2 1-3.5 2-5 .5 1 1.5 1.5 2.5 1.5 0-3 .5-5 2-9Z" />
    </svg>
  );
}

export function BodyIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <circle cx="12" cy="4" r="2" />
      <path {...round} d="M8 22v-5l-2-7 6-3 6 3-2 7v5" />
    </svg>
  );
}

export function ScoreIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path {...round} d="M11.48 3.5a.562.562 0 0 1 1.04 0l2.13 4.32a.562.562 0 0 0 .424.307l4.766.694c.5.072.7.69.336 1.045l-3.448 3.36a.562.562 0 0 0-.162.498l.815 4.747c.085.5-.44.882-.886.643l-4.263-2.241a.562.562 0 0 0-.523 0l-4.263 2.241c-.446.235-.971-.144-.886-.643l.815-4.747a.562.562 0 0 0-.162-.498L3.766 9.866c-.363-.354-.164-.973.336-1.045l4.766-.694a.562.562 0 0 0 .424-.307L11.48 3.5Z" />
    </svg>
  );
}

export function ChartLineIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path {...round} d="M3 3v18h18" />
      <path {...round} d="M7 14l3-3 4 4 5-7" />
    </svg>
  );
}

export function SparkleIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path {...round} d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
      <path {...round} d="M19 14l.7 1.9L21.5 16.5l-1.8.6L19 19l-.7-1.9L16.5 16.5l1.8-.6L19 14Z" />
    </svg>
  );
}

export function BellIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path {...round} d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75v-.7A6 6 0 0 0 12 3a6 6 0 0 0-6 6.05v.7a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m8.114 0a25.32 25.32 0 0 1-8.114 0m8.114 0c.092.5.143 1.014.143 1.538a3 3 0 1 1-6.286-.018c0-.518.051-1.026.143-1.52" />
    </svg>
  );
}

export function PlusIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path {...round} d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ChevronRightIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path {...round} d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function CloseIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path {...round} d="M6 6l12 12M6 18 18 6" />
    </svg>
  );
}

export function CheckIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path {...round} d="m5 12 5 5 9-11" />
    </svg>
  );
}

export function BluetoothIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path {...round} d="M7 7l10 10-5 5V2l5 5L7 17" />
    </svg>
  );
}

export function ArrowUpIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path {...round} d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export function ArrowDownIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path {...round} d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  );
}

export function ScaleDeviceIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path {...round} d="M8 8h8M9 11h6M10 14h4" />
    </svg>
  );
}

export function UserIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <circle cx="12" cy="8" r="4" />
      <path {...round} d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function SunIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <circle cx="12" cy="12" r="4" />
      <path {...round} d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

export function MoonIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path {...round} d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
    </svg>
  );
}

export function DownloadIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path {...round} d="M12 3v13M7 11l5 5 5-5M3 21h18" />
    </svg>
  );
}

export function UploadIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path {...round} d="M12 21V8M7 13l5-5 5 5M3 21h18" />
    </svg>
  );
}

export function SettingsIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <circle cx="12" cy="12" r="3" />
      <path {...round} d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.26.604.852 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.659 0-1.25.396-1.51 1Z" />
    </svg>
  );
}
