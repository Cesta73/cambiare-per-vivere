interface CircularTimerProps {
  progress: number; // 0..1
  timeDisplay: string;
  label?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function CircularTimer({
  progress,
  timeDisplay,
  label,
  size = 180,
  strokeWidth = 10,
  color = '#4a7363',
}: CircularTimerProps) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(progress, 1));
  const center = size / 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="#e3e0db"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-bold text-warm-gray-900 font-mono leading-none">{timeDisplay}</span>
        {label && <span className="text-xs text-warm-gray-500 mt-1 px-3 text-center leading-tight">{label}</span>}
      </div>
    </div>
  );
}

export function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
