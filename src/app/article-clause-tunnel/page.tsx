"use client";

import { useApp } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const content = {
  fr: {
    title: "L'article L.145-38-1 du Code de commerce",
    intro:
      "La loi n° 2026-403 du 26 mai 2026 (article 62) a introduit dans le Code de commerce un nouvel article L.145-38-1, qui encadre la révision du loyer des baux commerciaux en autorisant les parties à convenir d'une clause de variation encadrée — dite « clause tunnel ».",
    sections: [
      {
        title: "Ce que change la réforme",
        body: "Bailleur et preneur peuvent désormais fixer contractuellement un plancher et un plafond, exprimés en pourcentage, qui limitent l'ampleur de la variation du loyer d'une période de révision à l'autre.",
      },
      {
        title: "Clause symétrique ou asymétrique",
        body: "Une clause symétrique encadre la variation à la hausse et à la baisse. Une clause asymétrique protège le preneur d'une baisse du loyer en dessous du loyer en cours, tout en plafonnant la hausse.",
      },
      {
        title: "Le problème de l'indice ICC",
        body: "De nombreux baux anciens sont encore indexés sur l'indice du coût de la construction (ICC), aujourd'hui inadapté aux locaux commerciaux. Un avenant permet de lui substituer l'indice ILC (activités commerciales et artisanales) ou ILAT (activités tertiaires).",
      },
    ],
    cta: "Calculer une révision de loyer",
  },
  en: {
    title: "Article L.145-38-1 of the French Commercial Code",
    intro:
      "French law No. 2026-403 of 26 May 2026 (article 62) introduced a new article L.145-38-1 into the Commercial Code, which governs the revision of commercial lease rents by allowing the parties to agree on a rent-collar clause.",
    sections: [
      {
        title: "What the reform changes",
        body: "Landlords and tenants can now contractually set a floor and a cap, expressed as a percentage, limiting how much the rent can move from one review period to the next.",
      },
      {
        title: "Symmetric or asymmetric clause",
        body: "A symmetric clause limits both increases and decreases. An asymmetric clause protects the tenant from a decrease below the current rent while still capping increases.",
      },
      {
        title: "The ICC index problem",
        body: "Many older leases are still indexed on the construction cost index (ICC), now ill-suited to commercial premises. An amendment allows switching to the ILC (retail and craft activities) or ILAT (services activities) index.",
      },
    ],
    cta: "Calculate a rent review",
  },
} as const;

export default function ArticleClauseTunnel() {
  const { locale } = useApp();
  const c = content[locale];

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 py-20 tunnel-enter">
          <h1 className="font-serif text-3xl font-medium sm:text-4xl">{c.title}</h1>
          <p className="mt-6 text-lg text-[var(--foreground)]/80">{c.intro}</p>
          <div className="mt-10 flex flex-col gap-8">
            {c.sections.map((s) => (
              <section key={s.title}>
                <h2 className="font-serif text-xl">{s.title}</h2>
                <p className="mt-2 text-[var(--foreground)]/75">{s.body}</p>
              </section>
            ))}
          </div>
          <a href="/dashboard/calculateur" className="btn-primary transition-base mt-12 inline-flex">
            {c.cta}
          </a>
        </article>
      </main>
      <Footer />
    </>
  );
}
