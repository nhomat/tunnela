export function TunnelVisual() {
  return (
    <div className="tunnel-visual" aria-hidden="true">
      <div className="tunnel-cube">
        <span className="tunnel-face tunnel-face-front" />
        <span className="tunnel-face tunnel-face-back" />
        <span className="tunnel-face tunnel-face-right" />
        <span className="tunnel-face tunnel-face-left" />
        <span className="tunnel-face tunnel-face-top" />
        <span className="tunnel-face tunnel-face-bottom" />
      </div>
    </div>
  );
}
