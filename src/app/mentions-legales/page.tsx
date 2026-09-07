import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Mentions légales — Tunnela",
};

export default function MentionsLegalesPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl flex-1 px-6 py-16">
        <h1 className="mb-8 font-serif text-3xl">Mentions légales</h1>

        <Section title="Éditeur du site">
          <p>
            Le site Tunnela est édité par : <em>[Raison sociale à compléter]</em>, [forme
            juridique à compléter], au capital de [montant à compléter], immatriculée au RCS de
            [ville à compléter] sous le numéro [SIREN/SIRET à compléter], dont le siège social est
            situé [adresse à compléter].
          </p>
          <p className="mt-2">
            Numéro de TVA intracommunautaire : [à compléter, le cas échéant].
          </p>
          <p className="mt-2">
            Directeur de la publication : [nom à compléter].
          </p>
          <p className="mt-2">Contact : [adresse email à compléter].</p>
        </Section>

        <Section title="Hébergement">
          <p>
            Le site est hébergé par <strong>Vercel Inc.</strong>, 340 S Lemon Ave #4133, Walnut,
            CA 91789, États-Unis.
          </p>
          <p className="mt-2">
            Les données (comptes, baux, abonnements) sont stockées par{" "}
            <strong>Supabase</strong>, sur une infrastructure hébergée dans l&apos;Union
            européenne.
          </p>
          <p className="mt-2">
            Les paiements sont traités par <strong>Stripe</strong>. Tunnela ne stocke aucune
            donnée de carte bancaire.
          </p>
          <p className="mt-2">
            Les emails transactionnels sont envoyés via <strong>Resend</strong>.
          </p>
        </Section>

        <Section title="Propriété intellectuelle">
          <p>
            L&apos;ensemble des contenus du site (textes, logo, structure, code) est protégé par
            le droit de la propriété intellectuelle. Toute reproduction non autorisée est
            interdite.
          </p>
        </Section>

        <Section title="Protection des données personnelles (RGPD)">
          <p>
            Conformément au Règlement (UE) 2016/679 et à la loi Informatique et Libertés, vous
            disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de
            limitation, d&apos;opposition et de portabilité sur vos données personnelles.
          </p>
          <p className="mt-2">
            Les données collectées (email, données de connexion, contenu de votre portefeuille de
            baux) sont utilisées exclusivement pour fournir le service Tunnela et ne sont jamais
            vendues à des tiers.
          </p>
          <p className="mt-2">
            Vous pouvez exercer ces droits, y compris supprimer votre compte et l&apos;ensemble de
            vos données, directement depuis la page{" "}
            <Link href="/dashboard/parametres" className="text-[var(--accent)] underline">
              Paramètres
            </Link>{" "}
            de votre tableau de bord, ou en nous contactant à [adresse email à compléter].
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            Tunnela utilise uniquement des cookies et un stockage local strictement nécessaires
            au fonctionnement du service (session de connexion, préférence de thème clair/sombre,
            préférence de langue). Aucun cookie publicitaire ou de mesure d&apos;audience
            tiers n&apos;est utilisé.
          </p>
        </Section>

        <Section title="Limitation de responsabilité">
          <p>
            Les clauses tunnel et avenants générés par Tunnela citent l&apos;article L.145-38-1
            du Code de commerce et suivent une structure juridique standard. Ils ne constituent
            pas un conseil juridique personnalisé. Nous recommandons une relecture par votre
            conseil habituel avant signature pour toute situation complexe.
          </p>
        </Section>

        <Section title="Droit applicable">
          <p>Les présentes mentions légales sont soumises au droit français.</p>
        </Section>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 font-serif text-xl">{title}</h2>
      <div className="text-sm leading-relaxed text-[var(--foreground)]/80">{children}</div>
    </section>
  );
}
