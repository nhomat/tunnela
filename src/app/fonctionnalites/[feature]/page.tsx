import type { Metadata } from "next";
import { dictionary } from "@/i18n/dictionary";
import { FeatureDetailClient } from "./feature-detail-client";

const FEATURE_KEYS = ["portfolio", "calculator", "generator", "alerts"] as const;
type FeatureKey = (typeof FEATURE_KEYS)[number];

function isFeatureKey(value: string): value is FeatureKey {
  return (FEATURE_KEYS as readonly string[]).includes(value);
}

export function generateStaticParams() {
  return FEATURE_KEYS.map((feature) => ({ feature }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ feature: string }>;
}): Promise<Metadata> {
  const { feature } = await params;
  if (!isFeatureKey(feature)) {
    return { title: "Fonctionnalité introuvable — Tunnela" };
  }
  const info = dictionary.fr.features[feature];
  const detail = dictionary.fr.featureDetail[feature];
  return {
    title: `Tunnela — ${info.title}`,
    description: detail.tagline,
  };
}

export default function FeatureDetailPage() {
  return <FeatureDetailClient />;
}
