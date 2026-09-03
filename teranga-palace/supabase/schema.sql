-- ============================================================================
-- TERANGA PALACE — SCHÉMA DE BASE DE DONNÉES SUPABASE (PostgreSQL)
-- Basé sur le rapport UML (Client, Chambre, Réservation, Séjour, Paiement,
-- Facture) + tables e-commerce hôtelier (pays, villes, hôtels, avis)
-- ============================================================================
-- Comment l'utiliser :
-- 1. Ouvrir ton projet Supabase → SQL Editor → New query
-- 2. Coller tout ce fichier → Run
-- 3. Faire de même avec seed.sql pour avoir des données de démo
-- ============================================================================

-- Extension utile pour générer des UUID
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. UTILISATEURS (profil lié à auth.users géré par Supabase Auth)
-- ----------------------------------------------------------------------------
create table if not exists public.utilisateurs (
  id uuid primary key references auth.users(id) on delete cascade,
  nom text not null,
  prenom text not null,
  email text not null unique,
  telephone text,
  role text not null default 'client' check (role in ('client', 'receptionniste', 'gestionnaire', 'admin')),
  date_creation timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. PAYS
-- ----------------------------------------------------------------------------
create table if not exists public.pays (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  code text not null unique,           -- ex: SN, MA, FR, TR, AE, ES
  drapeau_emoji text,                  -- ex: 🇸🇳
  image_url text
);

-- ----------------------------------------------------------------------------
-- 3. VILLES
-- ----------------------------------------------------------------------------
create table if not exists public.villes (
  id uuid primary key default gen_random_uuid(),
  pays_id uuid not null references public.pays(id) on delete cascade,
  nom text not null,
  image_url text
);

-- ----------------------------------------------------------------------------
-- 4. HOTELS
-- ----------------------------------------------------------------------------
create table if not exists public.hotels (
  id uuid primary key default gen_random_uuid(),
  ville_id uuid not null references public.villes(id) on delete cascade,
  nom text not null,
  adresse text not null,
  description text,
  etoiles int not null default 5 check (etoiles between 1 and 5),
  services text[] default '{}',        -- ex: {"Piscine","WiFi","Spa","Restaurant","Salle de sport","Parking"}
  photo_principale text,
  galerie_photos text[] default '{}',
  latitude double precision,
  longitude double precision,
  actif boolean not null default true,
  date_creation timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. CHAMBRES
-- ----------------------------------------------------------------------------
create table if not exists public.chambres (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  numero text not null,
  type text not null check (type in ('Simple', 'Double', 'Suite', 'Familiale', 'Deluxe')),
  capacite_adultes int not null default 2,
  capacite_enfants int not null default 0,
  prix_nuit numeric(10,2) not null,
  description text,
  photos text[] default '{}',
  statut text not null default 'disponible' check (statut in ('disponible', 'occupee', 'hors_service')),
  unique (hotel_id, numero)
);

-- ----------------------------------------------------------------------------
-- 6. RESERVATIONS
-- ----------------------------------------------------------------------------
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.utilisateurs(id) on delete cascade,
  chambre_id uuid not null references public.chambres(id) on delete cascade,
  date_arrivee date not null,
  heure_arrivee time default '14:00',
  date_depart date not null,
  heure_depart time default '12:00',
  nb_adultes int not null default 1,
  nb_enfants int not null default 0,
  prix_total numeric(10,2) not null,
  taxes numeric(10,2) not null default 0,
  statut text not null default 'confirmee' check (statut in ('en_attente','confirmee','annulee','terminee')),
  date_creation timestamptz not null default now(),
  check (date_depart > date_arrivee)
);

-- Empêche le chevauchement de deux réservations actives sur la même chambre
create extension if not exists btree_gist;
alter table public.reservations
  add constraint no_overlap_reservations
  exclude using gist (
    chambre_id with =,
    daterange(date_arrivee, date_depart) with &&
  ) where (statut in ('confirmee','en_attente'));

-- ----------------------------------------------------------------------------
-- 7. SEJOURS (arrivée/départ réels du client, dérivé de la réservation)
-- ----------------------------------------------------------------------------
create table if not exists public.sejours (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique references public.reservations(id) on delete cascade,
  arrivee_reelle timestamptz,
  depart_reel timestamptz,
  statut text not null default 'a_venir' check (statut in ('a_venir','en_cours','termine'))
);

-- ----------------------------------------------------------------------------
-- 8. FACTURES
-- ----------------------------------------------------------------------------
create table if not exists public.factures (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique references public.reservations(id) on delete cascade,
  numero_facture text not null unique,
  montant_ht numeric(10,2) not null,
  montant_taxes numeric(10,2) not null,
  montant_total numeric(10,2) not null,
  date_emission timestamptz not null default now(),
  pdf_url text
);

-- ----------------------------------------------------------------------------
-- 9. PAIEMENTS
-- ----------------------------------------------------------------------------
create table if not exists public.paiements (
  id uuid primary key default gen_random_uuid(),
  facture_id uuid not null references public.factures(id) on delete cascade,
  montant numeric(10,2) not null,
  methode text not null check (methode in ('carte','mobile_money','especes','virement')),
  statut text not null default 'en_attente' check (statut in ('en_attente','valide','echoue','rembourse')),
  reference_transaction text,
  date_paiement timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 10. AVIS
-- ----------------------------------------------------------------------------
create table if not exists public.avis (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  client_id uuid not null references public.utilisateurs(id) on delete cascade,
  note int not null check (note between 1 and 5),
  commentaire text,
  date_creation timestamptz not null default now()
);

-- ============================================================================
-- FONCTIONS UTILES
-- ============================================================================

-- Crée automatiquement un profil utilisateur à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.utilisateurs (id, nom, prenom, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nom', ''),
    coalesce(new.raw_user_meta_data->>'prenom', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Note moyenne d'un hôtel (vue)
create or replace view public.hotel_notes as
select hotel_id, round(avg(note)::numeric, 1) as note_moyenne, count(*) as nb_avis
from public.avis
group by hotel_id;

-- Prix "à partir de" par hôtel (vue)
create or replace view public.hotel_prix_min as
select hotel_id, min(prix_nuit) as prix_min
from public.chambres
where statut != 'hors_service'
group by hotel_id;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

alter table public.utilisateurs enable row level security;
alter table public.pays enable row level security;
alter table public.villes enable row level security;
alter table public.hotels enable row level security;
alter table public.chambres enable row level security;
alter table public.reservations enable row level security;
alter table public.sejours enable row level security;
alter table public.factures enable row level security;
alter table public.paiements enable row level security;
alter table public.avis enable row level security;

-- Fonction helper : l'utilisateur courant est-il admin/gestionnaire ?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.utilisateurs
    where id = auth.uid() and role in ('admin', 'gestionnaire', 'receptionniste')
  );
$$ language sql stable security definer;

-- Lecture publique (catalogue) : pays, villes, hôtels, chambres, avis
create policy "Lecture publique pays" on public.pays for select using (true);
create policy "Lecture publique villes" on public.villes for select using (true);
create policy "Lecture publique hotels" on public.hotels for select using (true);
create policy "Lecture publique chambres" on public.chambres for select using (true);
create policy "Lecture publique avis" on public.avis for select using (true);

-- Écriture catalogue réservée aux admins
create policy "Admin gere pays" on public.pays for all using (is_admin()) with check (is_admin());
create policy "Admin gere villes" on public.villes for all using (is_admin()) with check (is_admin());
create policy "Admin gere hotels" on public.hotels for all using (is_admin()) with check (is_admin());
create policy "Admin gere chambres" on public.chambres for all using (is_admin()) with check (is_admin());

-- Utilisateurs : chacun voit/modifie son propre profil, admin voit tout
create policy "Voir son profil" on public.utilisateurs for select using (auth.uid() = id or is_admin());
create policy "Modifier son profil" on public.utilisateurs for update using (auth.uid() = id or is_admin());
create policy "Creation profil" on public.utilisateurs for insert with check (auth.uid() = id);

-- Réservations : le client voit/crée les siennes, admin voit tout
create policy "Voir ses reservations" on public.reservations for select using (client_id = auth.uid() or is_admin());
create policy "Creer une reservation" on public.reservations for insert with check (client_id = auth.uid() or is_admin());
create policy "Modifier ses reservations" on public.reservations for update using (client_id = auth.uid() or is_admin());
create policy "Annuler ses reservations" on public.reservations for delete using (client_id = auth.uid() or is_admin());

-- Séjours : visibles par le client concerné et l'admin
create policy "Voir ses sejours" on public.sejours for select using (
  exists (select 1 from public.reservations r where r.id = reservation_id and (r.client_id = auth.uid() or is_admin()))
);
create policy "Admin gere sejours" on public.sejours for all using (is_admin()) with check (is_admin());

-- Factures : visibles par le client concerné et l'admin
create policy "Voir ses factures" on public.factures for select using (
  exists (select 1 from public.reservations r where r.id = reservation_id and (r.client_id = auth.uid() or is_admin()))
);
create policy "Admin gere factures" on public.factures for all using (is_admin()) with check (is_admin());

-- Paiements : visibles par le client concerné et l'admin
create policy "Voir ses paiements" on public.paiements for select using (
  exists (
    select 1 from public.factures f
    join public.reservations r on r.id = f.reservation_id
    where f.id = facture_id and (r.client_id = auth.uid() or is_admin())
  )
);
create policy "Creer un paiement" on public.paiements for insert with check (
  exists (
    select 1 from public.factures f
    join public.reservations r on r.id = f.reservation_id
    where f.id = facture_id and (r.client_id = auth.uid() or is_admin())
  )
);
create policy "Admin gere paiements" on public.paiements for all using (is_admin()) with check (is_admin());

-- Avis : tout utilisateur connecté peut poster un avis, modifier le sien
create policy "Poster un avis" on public.avis for insert with check (client_id = auth.uid());
create policy "Modifier son avis" on public.avis for update using (client_id = auth.uid() or is_admin());
create policy "Supprimer son avis" on public.avis for delete using (client_id = auth.uid() or is_admin());
