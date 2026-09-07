export function TunnelVisual() {
  return (
    <div className="tunnel-visual" aria-hidden="true">
      <div className="tunnel-stage">
        <div className="tunnel-card-back" />
        <div className="tunnel-card-main">
          <div className="tunnel-card-header text-xs font-medium">
            <span className="tunnel-card-label">Bail commercial · Paris 8e</span>
            <span className="tunnel-card-badge text-[0.65rem] font-semibold">Conforme</span>
          </div>
          <div>
            <p className="tunnel-card-value font-serif text-3xl font-semibold">+2,8 %</p>
            <p className="tunnel-card-sub text-xs">Révision ILC · dans le tunnel</p>
          </div>
          <svg className="tunnel-chart" viewBox="0 0 260 100" preserveAspectRatio="none">
            <path className="tunnel-chart-band" d="M0,26 C60,20 130,30 260,16 L260,94 C130,78 60,90 0,84 Z" />
            <path className="tunnel-chart-bound" d="M0,26 C60,20 130,30 260,16" />
            <path className="tunnel-chart-bound" d="M0,84 C60,90 130,78 260,94" />
            <path
              className="tunnel-chart-line"
              pathLength={1}
              d="M0,55 C50,46 90,62 130,52 C170,44 210,58 260,50"
            />
            <circle className="tunnel-chart-dot" r="4" />
          </svg>
        </div>
      </div>
    </div>
  );
}
