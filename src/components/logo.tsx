export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="17" stroke="var(--foreground)" strokeWidth="2.5" />
      <circle cx="20" cy="20" r="11.5" stroke="var(--foreground)" strokeWidth="2" opacity="0.45" />
      <circle cx="20" cy="20" r="6" fill="var(--color-laiton)" />
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
