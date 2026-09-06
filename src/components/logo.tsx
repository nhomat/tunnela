export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M28 62 L50 32 L72 55"
        stroke="var(--foreground)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M42 50 L58 36 L74 52"
        stroke="var(--color-laiton)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M58 55 L82 82" stroke="var(--foreground)" strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}

export function LogoMark({
  withWordmark = true,
  className = "",
}: {
  withWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Logo />
      {withWordmark && (
        <span className="font-serif text-lg font-medium tracking-tight">Tunnela</span>
      )}
    </span>
  );
}
