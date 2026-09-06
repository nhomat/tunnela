export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Losange inachevé : 3 côtés sur 4, le côté bas-gauche manque volontairement. */}
      <path
        d="M20 50 L50 20 L80 50 L50 80"
        stroke="var(--logo-primary)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M42 46 L58 34 L74 46"
        stroke="var(--color-laiton)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
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
