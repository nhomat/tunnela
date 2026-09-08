# Tunnela

Copilote de gestion des révisions de baux commerciaux : calcul d'indexation
ILC/ILAT, génération de clause tunnel et d'avenant ICC → ILC, portefeuille de
baux, alertes d'échéance et abonnement Stripe.

Stack : Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (auth +
base de données) + Stripe (abonnements) + Resend (emails d'alerte). Pensé
pour un déploiement Vercel.

**En ligne :** https://tunnela.fr

## Démarrage local

```bash
npm install
cp .env.example .env.local   # puis renseigner les variables, voir ci-dessous
npm run dev
```

Sans les variables Supabase, les pages publiques (accueil, connexion,
article) fonctionnent normalement ; les routes `/dashboard/*` redirigent
vers `/login`.

## Configuration requise pour une mise en production complète

1. **Supabase**
   - Créer un projet sur [supabase.com](https://supabase.com).
   - Exécuter `supabase/schema.sql` dans l'éditeur SQL du projet.
   - Renseigner `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     et `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API).
   - Activer la connexion par lien magique (Auth → Providers → Email, OTP
     activé, mot de passe désactivé).

2. **Stripe**
   - Créer les 3 produits payants (Cabinet 35 €, Portefeuille 150 €,
     Foncière 290 €) en mensuel récurrent.
   - Renseigner `STRIPE_SECRET_KEY`, `STRIPE_PRICE_CABINET`,
     `STRIPE_PRICE_PORTEFEUILLE`, `STRIPE_PRICE_FONCIERE`.
   - Créer un webhook pointant vers `/api/stripe/webhook` (événements
     `checkout.session.completed`, `customer.subscription.updated`,
     `customer.subscription.deleted`) et renseigner
     `STRIPE_WEBHOOK_SECRET`.

3. **Resend** (alertes email d'échéance)
   - Renseigner `RESEND_API_KEY` et `ALERT_FROM_EMAIL`.
   - La route `/api/cron/alertes` est appelée automatiquement chaque jour
     par Vercel Cron (voir `vercel.json`), protégée par `CRON_SECRET`.
   - Tant qu'aucun domaine d'envoi n'est vérifié dans Resend, les emails ne
     partent que vers l'adresse du compte Resend lui-même (limitation
     Resend, pas du code) — utiliser `onboarding@resend.dev` comme
     expéditeur temporaire jusqu'à la vérification de `tunnela.fr`.

4. **Domaine `tunnela.fr`**
   - Le `.fr` n'est pas un TLD supporté par le registrar intégré de Vercel
     (règles AFNIC) : l'acheter chez un registrar externe (OVH, Gandi,
     IONOS…), puis l'ajouter dans Vercel → Project → Domains et suivre les
     enregistrements DNS fournis.
   - Une fois vérifié, ajouter le même domaine comme expéditeur dans Resend
     pour lever la limitation ci-dessus.

5. **Déploiement**
   - Connecté sur [Vercel](https://vercel.com/new) au dépôt GitHub,
     déploiement automatique à chaque push sur la branche de production.
   - Toutes les variables d'environnement ci-dessus sont à renseigner dans
     les réglages du projet Vercel.
   - Penser à mettre à jour l'URL du webhook Stripe si le domaine de
     production change.

Voir `.env.example` pour la liste complète des variables.

## Structure

```
src/
  app/                  pages et routes (App Router)
  components/           navbar, footer, logo, sidebar, providers thème/langue
  lib/                  logique métier (indexation, génération de clauses,
                         Stripe, Supabase) et types partagés
  i18n/                 dictionnaire de traduction FR/EN
supabase/schema.sql     schéma SQL (tables, RLS, trigger de bienvenue)
vercel.json             planification du cron d'alertes
```

## Notes importantes

- Les textes juridiques générés (clause tunnel, avenant) restent toujours en
  français, quelle que soit la langue de l'interface.
- La limite de baux par plan (3 / 20 / 100 / illimité) est appliquée côté
  interface dans `dashboard/baux`.
- `src/proxy.ts` (anciennement `middleware.ts` sous Next 15 et versions
  antérieures) rafraîchit la session Supabase et protège les routes
  `/dashboard/*`.
