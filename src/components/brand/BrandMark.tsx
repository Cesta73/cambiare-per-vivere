interface BrandMarkProps {
  className?: string;
  title?: string;
}

export function BrandMark({ className = 'w-10 h-10', title = 'Jarvis' }: BrandMarkProps) {
  return (
    <svg className={`living-orbit ${className}`} viewBox="0 0 100 100" role="img" aria-label={title} fill="none">
      <circle className="living-orbit__halo" cx="50" cy="50" r="45" />
      <g className="living-orbit__paths" stroke="currentColor" strokeWidth="2.25">
        <ellipse cx="50" cy="50" rx="37" ry="16" />
        <ellipse cx="50" cy="50" rx="37" ry="16" transform="rotate(60 50 50)" />
        <ellipse cx="50" cy="50" rx="37" ry="16" transform="rotate(120 50 50)" />
      </g>
      <g fill="currentColor">
        <circle cx="86.5" cy="50" r="2.6" />
        <circle cx="31.5" cy="18" r="2.6" />
        <circle cx="31.5" cy="82" r="2.6" />
        <circle className="living-orbit__center" cx="50" cy="50" r="6.5" />
      </g>
    </svg>
  );
}
