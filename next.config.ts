import type { NextConfig } from "next";

// Origine Supabase (REST + Realtime) à autoriser dans la CSP : dérivée de
// l'URL du projet, connue au moment du build. Si elle n'est pas définie
// (environnement local sans .env), on retombe sur 'self' uniquement — les
// pages publiques restent utilisables, seules les pages qui parlent à
// Supabase échoueront, comme déjà géré par src/proxy.ts.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "";
const supabaseWsOrigin = supabaseOrigin.replace(/^http/, "ws");
const connectSrc = ["'self'", supabaseOrigin, supabaseWsOrigin].filter(Boolean).join(" ");

// CSP pragmatique plutôt que stricte à base de nonce : le style et le
// script inline restent nécessaires ici (styles React dynamiques, petit
// script de préférence de thème dans layout.tsx). Elle bloque tout de
// même l'essentiel — scripts/styles/frames tiers, l'embarquement du site
// dans une iframe, et la fuite réseau vers un domaine non listé — sans
// exiger d'infrastructure de nonce qui compliquerait chaque futur ajout de
// script inline.
// React dev mode reconstructs stack traces with eval() for better error
// overlays/HMR ; ce n'est jamais utilisé en production (React le garantit
// lui-même), donc on ne l'autorise que hors production pour ne pas gêner
// le développement local sans affaiblir la CSP réellement déployée.
const isProd = process.env.NODE_ENV === "production";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  `connect-src ${connectSrc}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
