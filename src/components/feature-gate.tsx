"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "./providers";
import { createClient } from "@/lib/supabase/client";
import { hasFeature, minPlanForFeature } from "@/lib/types";
import type { Feature, Plan } from "@/lib/types";
import { PLANS } from "@/lib/stripe";

export function useCurrentPlan() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("abonnements")
        .select("plan, is_admin")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setPlan(data.plan as Plan);
        setIsAdmin(Boolean(data.is_admin));
      }
      setLoading(false);
    })();
  }, []);

  return { plan, isAdmin, loading };
}

export function FeatureGate({
  feature,
  plan,
  children,
}: {
  feature: Feature;
  plan: Plan | null;
  children: React.ReactNode;
}) {
  const { t } = useApp();

  if (plan === null) return null;
  if (hasFeature(plan, feature)) return <>{children}</>;

  const requiredPlan = minPlanForFeature(feature);
  const planName = PLANS.find((p) => p.id === requiredPlan)?.nom ?? requiredPlan;

  return (
    <div className="card tunnel-enter text-center">
      <p className="font-serif text-lg">{t.dashboard.featureLocked}</p>
      <p className="mt-2 text-sm text-[var(--foreground)]/70">
        {t.dashboard.featureLockedBody} {planName}
      </p>
      <Link href="/dashboard/abonnement" className="btn-primary transition-base mt-4 inline-flex text-sm">
        {t.baux.upgrade}
      </Link>
    </div>
  );
}
