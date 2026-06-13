import type { MetricStatus } from '@/features/metrics/classify';

interface AnnotationDot {
  key: string;
  label: string;
  cx: number;   // percentage of viewBox width (0-100)
  cy: number;   // percentage of viewBox height (0-100)
  status: MetricStatus;
}

interface BodySilhouetteProps {
  mode: 'fat' | 'muscle';
  dots: AnnotationDot[];
  onDotClick?: (key: string) => void;
}

const STATUS_COLOR: Record<MetricStatus, string> = {
  optimal: '#5C8A28',
  normal:  '#5C8A28',
  low:     '#2563EB',
  high:    '#D97706',
  alert:   '#DC2626',
  unknown: '#9CA3AF',
};

export function BodySilhouette({ dots, onDotClick }: BodySilhouetteProps) {
  const VW = 200;
  const VH = 420;

  const FILL   = '#F4F9FC';
  const STROKE = '#71B1BD';

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className="w-full max-w-[180px] mx-auto"
    >
      {/* Head */}
      <ellipse cx="100" cy="38" rx="20" ry="22" fill={FILL} stroke={STROKE} strokeWidth="1.4" />
      {/* Neck */}
      <rect x="92" y="58" width="16" height="14" fill={FILL} />
      {/* Torso */}
      <path
        d="M70 72 L58 80 L52 170 L148 170 L142 80 L130 72 Q100 66 70 72 Z"
        fill={FILL} stroke={STROKE} strokeWidth="1.4"
      />
      {/* Left arm */}
      <path d="M58 80 L42 86 L34 160 L50 162 L60 96 Z" fill={FILL} stroke={STROKE} strokeWidth="1.4" />
      {/* Right arm */}
      <path d="M142 80 L158 86 L166 160 L150 162 L140 96 Z" fill={FILL} stroke={STROKE} strokeWidth="1.4" />
      {/* Left leg */}
      <path d="M78 170 L70 290 L92 292 L100 220 Z" fill={FILL} stroke={STROKE} strokeWidth="1.4" />
      {/* Right leg */}
      <path d="M122 170 L130 290 L108 292 L100 220 Z" fill={FILL} stroke={STROKE} strokeWidth="1.4" />

      {/* Annotation dots */}
      {dots.map((dot) => {
        const x = (dot.cx / 100) * VW;
        const y = (dot.cy / 100) * VH;
        const color = STATUS_COLOR[dot.status];
        return (
          <g
            key={dot.key}
            onClick={() => onDotClick?.(dot.key)}
            style={{ cursor: 'pointer' }}
          >
            <circle cx={x} cy={y} r={10} fill={color} fillOpacity={0.18} className="animate-pulse_dot" />
            <circle cx={x} cy={y} r={4.5} fill={color} stroke="#FFFFFF" strokeWidth={2} />
            <text
              x={x + 12}
              y={y + 4}
              fill="#11141A"
              fontSize="10"
              fontFamily="Roboto, sans-serif"
              fontWeight="600"
            >
              {dot.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
