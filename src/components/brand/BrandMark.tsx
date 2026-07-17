interface BrandMarkProps {
  className?: string;
  title?: string;
}

export function BrandMark({ className = 'w-10 h-10', title = 'Jarvis' }: BrandMarkProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" role="img" aria-label={title} fill="none">
      <rect width="100" height="100" rx="18" fill="#082C39" />
      <circle cx="50" cy="48" r="34" stroke="#D8A84E" strokeWidth="3" />
      <g fill="#D8A84E">
        <path d="M50 5 54 37H46L50 5Z" />
        <path d="m95 48-32 4v-8l32 4Z" />
        <path d="m5 48 32-4v8L5 48Z" />
        <path d="m50 94-4-31h8l-4 31Z" />
      </g>
      <g fill="#9DAF91">
        <path d="m21 19 22 17-6 6-16-23Z" />
        <path d="m79 19-16 23-6-6 22-17Z" />
        <path d="m79 77-22-17 6-6 16 23Z" />
        <path d="m21 77 16-23 6 6-22 17Z" />
      </g>
      <g fill="#082C39" stroke="#D8A84E" strokeWidth="3">
        <circle cx="24" cy="24" r="4" />
        <circle cx="76" cy="24" r="4" />
        <circle cx="76" cy="72" r="4" />
        <circle cx="24" cy="72" r="4" />
        <circle cx="50" cy="48" r="13" />
      </g>
      <path
        d="M50 37c1.2 5.4-4.8 7.8-4.8 13 0 3.3 2 5.9 5.1 7.1-1.2-2.5-.5-4.7 1.5-7.1 2.3 3.1 3.7 5.5 3.7 8 0 3.4-2.2 6.1-5.5 7.2-5.8-1.5-9.2-5.6-9.2-10.7 0-6.5 6.6-10 9.2-17.5Z"
        fill="#F0BD58"
      />
      <path
        d="M50 61v18c0 7-5 10-9.4 7.4-2.8-1.7-3.1-5.8-.7-7.9"
        stroke="#D8A84E"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
