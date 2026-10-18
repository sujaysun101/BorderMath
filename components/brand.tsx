export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <path d="M20 7.5v6.5M20 26v6.5M7.5 20h6.5M26 20h6.5" stroke="currentColor" strokeWidth="1.2" />
      <text x="20" y="23.5" textAnchor="middle" fontSize="9" fontFamily="Georgia, serif" fill="currentColor">
        90
      </text>
    </svg>
  );
}
