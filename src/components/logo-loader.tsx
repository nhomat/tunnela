export function LogoLoader() {
  return (
    <div className="logo-loader" role="status" aria-live="polite">
      <svg viewBox="0 0 100 100" className="logo-loader-svg" fill="none" aria-hidden="true">
        <path
          d="M20 50 L50 20 L80 50 L50 80"
          stroke="var(--logo-primary)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={100}
          className="logo-loader-path logo-loader-path-outer"
        />
        <path
          d="M42 46 L58 34 L74 46"
          stroke="var(--color-laiton)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={100}
          className="logo-loader-path logo-loader-path-inner"
        />
      </svg>
      <p className="mt-3 font-serif text-sm tracking-wide text-[var(--foreground)]/60">Tunnela</p>
    </div>
  );
}
