"use client";

import { useApp } from "./providers";
import { PLANS } from "@/lib/stripe";
import type { Plan } from "@/lib/types";

export function Pricing({
  currentPlan,
  onSelect,
}: {
  currentPlan?: Plan;
  onSelect?: (plan: Plan) => void;
}) {
  const { t, locale } = useApp();

  return (
    <section id="tarifs" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-12 text-center">
        <h2 className="font-serif text-3xl font-medium">{t.pricing.title}</h2>
        <p className="mt-2 text-[var(--foreground)]/70">{t.pricing.subtitle}</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const limiteLabel =
            plan.limiteBaux === null
              ? `${t.pricing.beyond} 100 ${t.pricing.leases}`
              : `${t.pricing.upTo} ${plan.limiteBaux} ${t.pricing.leases}`;

          const features = t.pricing.planFeatures[plan.id];

          return (
            <div key={plan.id} className="card tunnel-enter flex flex-col gap-4">
              <div>
                <h3 className="font-serif text-xl">{plan.nom}</h3>
                <p className="mt-1 text-sm text-[var(--foreground)]/70">{limiteLabel}</p>
              </div>
              <ul className="flex flex-col gap-2 text-sm text-[var(--foreground)]/80">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span aria-hidden="true" className="text-[var(--success)]">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <p className="font-serif text-3xl">
                  {plan.prixMensuel === 0
                    ? t.pricing.free
                    : `${plan.prixMensuel} €${locale === "fr" ? "" : ""}`}
                  {plan.prixMensuel !== 0 && (
                    <span className="text-sm text-[var(--foreground)]/60">
                      {" "}
                      {t.pricing.perMonth}
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => onSelect?.(plan.id)}
                  className={`transition-base mt-4 w-full ${
                    isCurrent ? "btn-secondary opacity-60" : "btn-primary"
                  }`}
                >
                  {isCurrent ? t.pricing.current : t.pricing.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
