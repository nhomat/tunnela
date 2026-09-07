const RING_COUNT = 6;

export function TunnelVisual() {
  return (
    <div className="tunnel-visual" aria-hidden="true">
      <div className="tunnel-visual-stage">
        {Array.from({ length: RING_COUNT }).map((_, i) => (
          <span
            key={i}
            className="tunnel-ring"
            style={{ animationDelay: `${i * -0.9}s` }}
          />
        ))}
        <span className="tunnel-core" />
      </div>
    </div>
  );
}
