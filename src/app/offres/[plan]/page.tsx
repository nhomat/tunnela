import type { Metadata } from "next";
import { PLANS } from "@/lib/stripe";
import { dictionary } from "@/i18n/dictionary";
import type { Plan } from "@/lib/types";
import { OffreDetailClient } from "./offre-detail-client";

function isPlan(value: string): value is Plan {
  return PLANS.some((p) => p.id === value);
}

export function generateStaticParams() {
  return PLANS.map((plan) => ({ plan: plan.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ plan: string }>;
}): Promise<Metadata> {
  const { plan: planId } = await params;
  if (!isPlan(planId)) {
    return { title: "Offre introuvable — Tunnela" };
  }
  const plan = PLANS.find((p) => p.id === planId)!;
  const detail = dictionary.fr.planDetail[planId];
  return {
    title: `Tunnela — ${plan.nom} : ${detail.tagline}`,
    description: detail.idealFor,
  };
}

export default function OffreDetailPage() {
  return <OffreDetailClient />;
}
