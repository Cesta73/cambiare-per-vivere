interface BrandMarkProps {
  className?: string;
  title?: string;
}

export function BrandMark({ className = 'w-10 h-10', title = 'Jarvis' }: BrandMarkProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label={title} fill="none">
      <circle cx="29" cy="27" r="18" stroke="currentColor" strokeWidth="2" />
      <circle cx="29" cy="27" r="3" fill="currentColor" />
      {[0, 45, 90, 135].map(angle => (
        <path
          key={angle}
          d="M29 5V16M29 38V49"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
          transform={`rotate(${angle} 29 27)`}
        />
      ))}
      <path
        d="M29 27V48C29 56 39 59 44 52C47 48 46 43 46 38"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="29" cy="5" r="2.5" fill="#D8A331" />
    </svg>
  );
}
