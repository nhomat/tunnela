import type { MetadataRoute } from "next";
import { appUrl, PLANS } from "@/lib/stripe";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  const staticPaths = [
    "",
    "/article-clause-tunnel",
    "/mentions-legales",
    "/reserver-un-call",
    "/login",
    "/signup",
  ];

  const offerPaths = PLANS.map((plan) => `/offres/${plan.id}`);

  return [...staticPaths, ...offerPaths].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
