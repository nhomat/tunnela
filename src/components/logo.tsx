export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 30C6 30 4 24 4 20C4 16 6 10 12 10"
        stroke="var(--foreground)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M20 32C13 32 10 27 10 20C10 13 13 8 20 8"
        stroke="var(--color-laiton)"
        strokeWidth="3"
        strokeLinecap="round"
      />
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
