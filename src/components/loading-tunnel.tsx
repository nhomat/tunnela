export function LoadingTunnel({ label }: { label?: string }) {
  return (
    <div className="loading-tunnel" role="status" aria-live="polite">
      <div className="loading-tunnel-stage">
        <span className="loading-ring" style={{ animationDelay: "-1.2s" }} />
        <span className="loading-ring" style={{ animationDelay: "-0.6s" }} />
        <span className="loading-ring" style={{ animationDelay: "0s" }} />
        <span className="loading-core" />
      </div>
      {label && <p className="mt-4 text-sm text-[var(--foreground)]/60">{label}</p>}
    </div>
  );
}
