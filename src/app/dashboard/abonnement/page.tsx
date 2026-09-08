"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { createClient } from "@/lib/supabase/client";
import { Pricing } from "@/components/pricing";
import { COOP_ADDON_NOM, COOP_ADDON_PRIX_MENSUEL } from "@/lib/stripe";
import { PageIcon3D } from "@/components/page-icon-3d";
import type { Plan } from "@/lib/types";

export default function AbonnementPage() {
  const { t } = useApp();
  const supabase = useMemo(() => createClient(), []);
  const [plan, setPlan] = useState<Plan>("decouverte");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("abonnements")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setPlan(data.plan as Plan);
    })();
  }, [supabase]);

  async function handleSelect(selected: Plan) {
    if (selected === "decouverte") return;
    setPending(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: selected }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="tunnel-enter">
      <div className="mb-2 flex items-center gap-3">
        <PageIcon3D>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 2.5l1.8 4.4 4.7 0.4-3.6 3 1.1 4.6L10 12.6l-4 2.3 1.1-4.6-3.6-3 4.7-.4L10 2.5Z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
        </PageIcon3D>
        <h1 className="font-serif text-2xl">{t.pricing.title}</h1>
      </div>
      <p className="mb-6 text-sm text-[var(--foreground)]/70">{t.pricing.subtitle}</p>
      {pending && <p className="mb-4 text-sm text-[var(--accent)]">…</p>}
      <div className="-mx-6">
        <Pricing currentPlan={plan} onSelect={handleSelect} />
      </div>
      {plan !== "decouverte" && (
        <div className="card mt-8">
          <h2 className="font-serif text-lg">{t.equipe.addonTitle}</h2>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">
            {t.equipe.addonSubtitle} +{COOP_ADDON_PRIX_MENSUEL} € {t.pricing.perMonth}.
          </p>
          <Link href="/dashboard/equipe" className="btn-secondary transition-base mt-4 inline-flex text-sm">
            {COOP_ADDON_NOM} →
          </Link>
        </div>
      )}
    </div>
  );
}
