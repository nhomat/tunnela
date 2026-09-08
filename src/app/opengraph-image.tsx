import { ImageResponse } from "next/og";

export const alt = "Tunnela — L'outil indispensable pour vos révisions de baux commerciaux";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M20 50 L50 20 L80 50 L50 80" stroke="#33475b" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M42 46 L58 34 L74 46" stroke="#a98a57" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
const logoDataUri = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString("base64")}`;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf9f5",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <img src={logoDataUri} width={140} height={140} alt="" />
          <span style={{ fontSize: 108, fontWeight: 600, color: "#33475b" }}>Tunnela</span>
        </div>
        <span style={{ marginTop: 28, fontSize: 32, color: "#33475b", opacity: 0.65 }}>
          Révisions de baux commerciaux, sécurisées.
        </span>
        <div style={{ marginTop: 40, width: 220, height: 6, background: "#a98a57", borderRadius: 999 }} />
      </div>
    ),
    { ...size }
  );
}
