create table if not exists equipes (
  id uuid primary key default gen_random_uuid(),
  proprietaire_user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null,
  created_at timestamptz not null default now(),
  unique (proprietaire_user_id)
);

alter table equipes enable row level security;

create policy "Le proprietaire gere son equipe"
  on equipes for all
  using (auth.uid() = proprietaire_user_id)
  with check (auth.uid() = proprietaire_user_id);

create table if not exists membres_equipe (
  id uuid primary key default gen_random_uuid(),
  equipe_id uuid not null references equipes(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'membre' check (role in ('proprietaire', 'membre')),
  statut text not null default 'invite' check (statut in ('invite', 'actif')),
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  unique (equipe_id, email)
);

alter table membres_equipe enable row level security;

-- Un membre actif peut voir la fiche de son équipe (nom, propriétaire).
-- is_active_member_of_equipe() est SECURITY DEFINER : elle contourne le RLS
-- en interne pour éviter la récursion infinie qui se produit quand une policy
-- sur membres_equipe (ou une policy en chaîne sur equipes/abonnements) se
-- réévalue elle-même via une sous-requête directe sur membres_equipe.
create or replace function public.is_active_member_of_equipe(target_equipe_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from membres_equipe
    where equipe_id = target_equipe_id and user_id = auth.uid() and statut = 'actif'
  );
$$;

revoke all on function public.is_active_member_of_equipe(uuid) from public, anon;
grant execute on function public.is_active_member_of_equipe(uuid) to authenticated;

create policy "Les membres voient leur equipe"
  on equipes for select
  using (is_active_member_of_equipe(equipes.id));

create policy "Le proprietaire gere les membres"
  on membres_equipe for all
  using (exists (select 1 from equipes e where e.id = membres_equipe.equipe_id and e.proprietaire_user_id = auth.uid()))
  with check (exists (select 1 from equipes e where e.id = membres_equipe.equipe_id and e.proprietaire_user_id = auth.uid()));

create policy "Un membre voit les lignes de sa propre equipe"
  on membres_equipe for select
  using (user_id = auth.uid() or is_active_member_of_equipe(equipe_id));

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
  indice_reference numeric,
  periodicite text not null default 'annuelle' check (periodicite in ('annuelle', 'trimestrielle')),
  preneur_email text,
  equipe_id uuid references equipes(id) on delete set null,
  visible_equipe boolean not null default false,
  created_at timestamptz not null default now()
);

alter table baux enable row level security;

create policy "Les utilisateurs voient leurs propres baux"
  on baux for select using (auth.uid() = user_id);

create policy "Les utilisateurs gèrent leurs propres baux"
  on baux for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Abonnement "Coop" : un membre actif d'une équipe voit les baux qu'un
-- collègue a explicitement marqués comme partagés (visible_equipe = true).
create policy "Les membres actifs voient les baux partages de leur equipe"
  on baux for select
  using (visible_equipe = true and equipe_id is not null and is_active_member_of_equipe(equipe_id));

create table if not exists abonnements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'decouverte' check (plan in ('decouverte', 'cabinet', 'portefeuille', 'fonciere')),
  is_admin boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  statut text not null default 'actif',
  nom_bailleur_defaut text,
  alert_delai_jours integer not null default 30 check (alert_delai_jours between 7 and 90),
  -- Coop est un add-on payant (ligne Stripe supplémentaire sur l'abonnement
  -- existant), pas un palier de plan séparé.
  coop_actif boolean not null default false,
  stripe_coop_item_id text,
  updated_at timestamptz not null default now()
);

alter table abonnements enable row level security;

create policy "Les utilisateurs voient leur propre abonnement"
  on abonnements for select using (auth.uid() = user_id);

-- Écriture réservée au service_role (webhook Stripe côté serveur uniquement,
-- jamais depuis le client) pour tous les comptes normaux : aucune policy
-- insert/update/delete pour les utilisateurs authentifiés sur cette table,
-- à l'exception du cas ci-dessous.

-- Un compte marqué is_admin peut changer son propre plan sans passer par
-- Stripe (sélecteur "vue client" du tableau de bord), pour tester chaque
-- offre en conditions réelles. Un utilisateur normal (is_admin = false)
-- ne peut jamais écrire sur cette table par ce biais.
create policy "Les administrateurs changent leur propre plan"
  on abonnements for update
  using (auth.uid() = user_id and is_admin)
  with check (auth.uid() = user_id and is_admin);

-- Permet à un utilisateur de modifier uniquement ses propres paramètres
-- (nom du bailleur, délai d'alerte) sans lui ouvrir une policy UPDATE
-- générale sur abonnements, qui laisserait sinon n'importe quel client
-- modifier son propre "plan" ou "is_admin" via la même requête PostgREST.
create or replace function public.update_my_parametres(p_nom_bailleur text, p_alert_delai_jours integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_alert_delai_jours < 7 or p_alert_delai_jours > 90 then
    raise exception 'alert_delai_jours doit etre entre 7 et 90';
  end if;
  update abonnements
  set nom_bailleur_defaut = nullif(trim(p_nom_bailleur), ''),
      alert_delai_jours = p_alert_delai_jours
  where user_id = auth.uid();
end;
$$;

revoke all on function public.update_my_parametres(text, integer) from public, anon;
grant execute on function public.update_my_parametres(text, integer) to authenticated;

-- Un membre actif d'une équipe Coop voit le plan de son propriétaire, pour
-- résoudre son "plan effectif" côté client (accès aux fonctionnalités Coop
-- même si son propre abonnement individuel est resté en Découverte).
create policy "Les membres voient le plan du proprietaire de leur equipe"
  on abonnements for select
  using (
    exists (
      select 1 from equipes e
      where e.proprietaire_user_id = abonnements.user_id and is_active_member_of_equipe(e.id)
    )
  );

-- Table de référence des indices ILC/ILAT/ICC publiés par l'INSEE, tenue à
-- jour manuellement par un administrateur Tunnela (feature "autoIndex" du
-- plan Foncière/Coop) : évite à chaque client de ressaisir la valeur
-- publiée pour calculer sa révision.
create table if not exists indices_publies (
  id uuid primary key default gen_random_uuid(),
  indice text not null check (indice in ('ILC', 'ILAT', 'ICC')),
  periode date not null,
  valeur numeric not null,
  source text not null default 'INSEE',
  created_at timestamptz not null default now(),
  unique (indice, periode)
);

alter table indices_publies enable row level security;

create policy "Tout le monde authentifie lit les indices publies"
  on indices_publies for select
  to authenticated
  using (true);

create policy "Seuls les admins gerent les indices publies"
  on indices_publies for all
  using (exists (select 1 from abonnements a where a.user_id = auth.uid() and a.is_admin))
  with check (exists (select 1 from abonnements a where a.user_id = auth.uid() and a.is_admin));

-- Messagerie sécurisée par équipe (plan Coop). can_access_equipe() couvre à
-- la fois le propriétaire (absent de membres_equipe) et les membres actifs.
create or replace function public.can_access_equipe(target_equipe_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from equipes where id = target_equipe_id and proprietaire_user_id = auth.uid())
    or exists (select 1 from membres_equipe where equipe_id = target_equipe_id and user_id = auth.uid() and statut = 'actif');
$$;

revoke all on function public.can_access_equipe(uuid) from public, anon;
grant execute on function public.can_access_equipe(uuid) to authenticated;

create table if not exists messages_equipe (
  id uuid primary key default gen_random_uuid(),
  equipe_id uuid not null references equipes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  contenu text not null check (char_length(contenu) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table messages_equipe enable row level security;

create policy "Les membres de l'equipe lisent les messages"
  on messages_equipe for select
  using (can_access_equipe(equipe_id));

create policy "Les membres de l'equipe envoient des messages"
  on messages_equipe for insert
  with check (can_access_equipe(equipe_id) and user_id = auth.uid());

create policy "Un auteur supprime son propre message"
  on messages_equipe for delete
  using (user_id = auth.uid());

create index if not exists baux_user_id_idx on baux (user_id);
create index if not exists baux_date_prochaine_revision_idx on baux (date_prochaine_revision);
create index if not exists indices_publies_indice_periode_idx on indices_publies (indice, periode desc);
create index if not exists messages_equipe_equipe_id_idx on messages_equipe (equipe_id, created_at);

alter publication supabase_realtime add table messages_equipe;

-- La limite de baux par plan n'était vérifiée que côté client (bouton
-- désactivé) : un appel direct à l'API REST avec un jeton valide pouvait la
-- contourner. On l'applique aussi en base, avec le même calcul de "plan
-- effectif" que côté application (un membre actif d'une équipe Coop hérite
-- du plan de base de son propriétaire).
create or replace function public.effective_plan(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_own_plan text;
  v_coop_actif boolean;
  v_owner_id uuid;
  v_owner_plan text;
  v_owner_coop_actif boolean;
begin
  select plan, coop_actif into v_own_plan, v_coop_actif
  from abonnements where user_id = p_user_id;

  if v_coop_actif then
    return v_own_plan;
  end if;

  select e.proprietaire_user_id into v_owner_id
  from membres_equipe me
  join equipes e on e.id = me.equipe_id
  where me.user_id = p_user_id and me.statut = 'actif';

  if v_owner_id is not null then
    select plan, coop_actif into v_owner_plan, v_owner_coop_actif
    from abonnements where user_id = v_owner_id;
    if v_owner_coop_actif then
      return v_owner_plan;
    end if;
  end if;

  return coalesce(v_own_plan, 'decouverte');
end;
$$;

revoke all on function public.effective_plan(uuid) from public, anon;
grant execute on function public.effective_plan(uuid) to authenticated;

create or replace function public.enforce_limite_baux()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_limite integer;
  v_count integer;
begin
  v_plan := effective_plan(new.user_id);
  v_limite := case v_plan
    when 'cabinet' then 20
    when 'portefeuille' then 100
    when 'fonciere' then 500
    else 3
  end;

  select count(*) into v_count from baux where user_id = new.user_id;
  if v_count >= v_limite then
    raise exception 'limite_baux_atteinte: plan % autorise % baux maximum', v_plan, v_limite;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_limite_baux_trigger on baux;
create trigger enforce_limite_baux_trigger
  before insert on baux
  for each row execute procedure public.enforce_limite_baux();

-- Un utilisateur nouvellement inscrit reçoit automatiquement un abonnement
-- "découverte" par défaut. S'il avait été invité dans une équipe Coop avec
-- cette adresse email avant son inscription, on l'y rattache aussitôt.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.abonnements (user_id, plan)
  values (new.id, 'decouverte')
  on conflict (user_id) do nothing;

  update public.membres_equipe
  set user_id = new.id, statut = 'actif', joined_at = now()
  where email = new.email and user_id is null;

  return new;
end;
$$;

-- Postgres accorde EXECUTE au pseudo-rôle PUBLIC par défaut à la création
-- d'une fonction, et anon/authenticated en héritent implicitement : révoquer
-- uniquement "from anon, authenticated" ne suffit pas, il faut viser PUBLIC.
revoke all on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
