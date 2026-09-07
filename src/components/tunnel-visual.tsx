const RING_SIZES = [100, 76, 52, 28];

export function TunnelVisual() {
  return (
    <div className="tunnel-visual" aria-hidden="true">
      <div className="tunnel-visual-stage">
        {RING_SIZES.map((size, i) => (
          <span
            key={size}
            className="tunnel-ring"
            style={{ width: `${size}%`, height: `${size}%`, animationDelay: `${i * 0.7}s` }}
          />
        ))}
        <span className="tunnel-core" />
      </div>
    </div>
  );
}
