"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/providers";
import { createClient } from "@/lib/supabase/client";
import { Pricing } from "@/components/pricing";
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
      <h1 className="mb-2 font-serif text-2xl">{t.pricing.title}</h1>
      <p className="mb-6 text-sm text-[var(--foreground)]/70">{t.pricing.subtitle}</p>
      {pending && <p className="mb-4 text-sm text-[var(--accent)]">…</p>}
      <div className="-mx-6">
        <Pricing currentPlan={plan} onSelect={handleSelect} />
      </div>
    </div>
  );
}
