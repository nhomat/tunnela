export function LoadingTunnel({ label }: { label?: string }) {
  return (
    <div className="loading-tunnel" role="status" aria-live="polite">
      <span className="loading-spinner" />
      {label && <p className="mt-4 text-sm text-[var(--foreground)]/60">{label}</p>}
    </div>
  );
}
