const RINGS = [
  { size: 100, rotate: "0deg" },
  { size: 76, rotate: "10deg" },
  { size: 52, rotate: "-8deg" },
  { size: 28, rotate: "6deg" },
];

export function TunnelVisual() {
  return (
    <div className="tunnel-visual" aria-hidden="true">
      <div className="tunnel-visual-stage">
        {RINGS.map((ring, i) => (
          <span
            key={ring.size}
            className="tunnel-ring"
            style={{
              width: `${ring.size}%`,
              height: `${ring.size}%`,
              rotate: ring.rotate,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
        <span className="tunnel-core" />
      </div>
    </div>
  );
}
