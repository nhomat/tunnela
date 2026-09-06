"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PLANS } from "@/lib/stripe";
import type { Plan } from "@/lib/types";
import { useApp } from "./providers";

export function AdminPlanSwitcher({ currentPlan }: { currentPlan: Plan }) {
  const { t } = useApp();
  const [pending, setPending] = useState(false);

  async function switchTo(plan: Plan) {
    if (plan === currentPlan || pending) return;
    setPending(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setPending(false);
      return;
    }
    await supabase.from("abonnements").update({ plan }).eq("user_id", user.id);
    window.location.reload();
  }

  return (
    <div className="mb-4 rounded-lg border border-dashed border-[var(--accent)]/50 p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--accent)]">
        {t.dashboard.adminSwitcherLabel}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            type="button"
            disabled={pending}
            onClick={() => switchTo(plan.id)}
            className={`transition-base rounded-md px-2 py-1 text-xs disabled:opacity-60 ${
              plan.id === currentPlan ? "bg-[var(--accent)] text-[var(--color-papier)]" : "btn-secondary"
            }`}
          >
            {plan.nom}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-snug text-[var(--foreground)]/50">
        {t.dashboard.adminSwitcherHint}
      </p>
    </div>
  );
}
