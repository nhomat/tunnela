create table if not exists baux (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  preneur text not null,
  adresse text,
  loyer_annuel numeric not null default 0,
  indice text not null check (indice in ('ILC', 'ILAT', 'ICC')),
  clause_tunnel boolean not null default false,
  plancher_pct numeric,
  plafond_pct numeric,
  date_prochaine_revision date,
  statut text not null default 'a_verifier' check (statut in ('conforme', 'a_verifier', 'non_conforme')),
  derniere_alerte_envoyee_le date,
  created_at timestamptz not null default now()
);

alter table baux enable row level security;

create policy "Les utilisateurs voient leurs propres baux"
  on baux for select using (auth.uid() = user_id);

create policy "Les utilisateurs gèrent leurs propres baux"
  on baux for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists abonnements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'decouverte' check (plan in ('decouverte', 'cabinet', 'portefeuille', 'fonciere')),
  is_admin boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  statut text not null default 'actif',
  updated_at timestamptz not null default now()
);

alter table abonnements enable row level security;

create policy "Les utilisateurs voient leur propre abonnement"
  on abonnements for select using (auth.uid() = user_id);

-- Écriture réservée au service_role (webhook Stripe côté serveur uniquement,
-- jamais depuis le client) : aucune policy insert/update/delete pour les
-- utilisateurs authentifiés sur cette table.

create index if not exists baux_user_id_idx on baux (user_id);
create index if not exists baux_date_prochaine_revision_idx on baux (date_prochaine_revision);

-- Un utilisateur nouvellement inscrit reçoit automatiquement un abonnement
-- "découverte" par défaut.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.abonnements (user_id, plan)
  values (new.id, 'decouverte')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
