
-- 1) Catégories de véhicules de location
create table if not exists public.rental_vehicle_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text not null default 'Car',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rental_vehicle_categories enable row level security;

create policy "Everyone can view active rental categories"
  on public.rental_vehicle_categories
  for select
  using (is_active = true);

create or replace trigger set_updated_at_rental_vehicle_categories
before update on public.rental_vehicle_categories
for each row execute function public.update_updated_at_column();

-- Catégories par défaut
insert into public.rental_vehicle_categories (name, description, icon)
values
  ('Moto', 'Idéal pour les déplacements rapides', 'Bike'),
  ('Voiture', 'Confort et polyvalence', 'Car'),
  ('Utilitaire', 'Transport de marchandises', 'Truck')
on conflict do nothing;

-- 2) Annonces de véhicules de location
create table if not exists public.rental_vehicles (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  category_id uuid not null references public.rental_vehicle_categories(id) on delete restrict,
  name text not null,
  brand text not null,
  model text not null,
  year integer not null,
  vehicle_type text not null,
  fuel_type text,
  transmission text,
  seats integer not null default 4,
  daily_rate numeric not null,
  hourly_rate numeric not null,
  weekly_rate numeric not null,
  security_deposit numeric not null default 0,
  features jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  license_plate text,
  location_address text,
  location_coordinates jsonb,
  is_active boolean not null default true,
  is_available boolean not null default true,
  moderation_status text not null default 'pending', -- pending | approved | rejected
  moderated_by uuid,
  moderated_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rental_vehicles enable row level security;

create index if not exists rental_vehicles_partner_idx on public.rental_vehicles(partner_id);
create index if not exists rental_vehicles_category_idx on public.rental_vehicles(category_id);
create index if not exists rental_vehicles_status_idx on public.rental_vehicles(moderation_status);

create or replace trigger set_updated_at_rental_vehicles
before update on public.rental_vehicles
for each row execute function public.update_updated_at_column();

-- Politiques RLS pour rental_vehicles
create policy "Partners can insert own vehicles"
  on public.rental_vehicles
  for insert
  with check (auth.uid() = partner_id);

create policy "Partners can update own vehicles"
  on public.rental_vehicles
  for update
  using (auth.uid() = partner_id);

create policy "Partners can delete own vehicles"
  on public.rental_vehicles
  for delete
  using (auth.uid() = partner_id);

create policy "Public can view approved rental vehicles"
  on public.rental_vehicles
  for select
  using ((moderation_status = 'approved') and (is_active = true));

create policy "Partners can view their own vehicles"
  on public.rental_vehicles
  for select
  using (auth.uid() = partner_id);

-- 3) Réservations de location
create table if not exists public.rental_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vehicle_id uuid not null references public.rental_vehicles(id) on delete cascade,
  rental_duration_type text not null default 'daily', -- hourly | half_day | daily | weekly
  start_date timestamptz not null,
  end_date timestamptz not null,
  pickup_location text not null,
  return_location text not null,
  total_amount numeric not null,
  security_deposit numeric not null default 0,
  special_requests text,
  status text not null default 'pending', -- pending | confirmed | in_progress | completed | cancelled | rejected | no_show
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rental_bookings enable row level security;

create index if not exists rental_bookings_user_idx on public.rental_bookings(user_id);
create index if not exists rental_bookings_vehicle_idx on public.rental_bookings(vehicle_id);
create index if not exists rental_bookings_status_idx on public.rental_bookings(status);

create or replace trigger set_updated_at_rental_bookings
before update on public.rental_bookings
for each row execute function public.update_updated_at_column();

-- Politiques RLS pour rental_bookings
create policy "Users can create their own rental bookings"
  on public.rental_bookings
  for insert
  with check (auth.uid() = user_id);

create policy "Users and partners can view bookings"
  on public.rental_bookings
  for select
  using (
    (auth.uid() = user_id)
    or exists (
      select 1 from public.rental_vehicles rv
      where rv.id = vehicle_id and rv.partner_id = auth.uid()
    )
  );

create policy "Users can update their own rental bookings"
  on public.rental_bookings
  for update
  using (auth.uid() = user_id);

create policy "Partners can update bookings for their vehicles"
  on public.rental_bookings
  for update
  using (
    exists (
      select 1 from public.rental_vehicles rv
      where rv.id = vehicle_id and rv.partner_id = auth.uid()
    )
  );

-- 4) Realtime configuration
alter table public.rental_vehicles replica identity full;
alter table public.rental_bookings replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.rental_vehicles;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.rental_bookings;
  exception when duplicate_object then null;
  end;
end$$;

-- 5) Stockage d'images (bucket public)
insert into storage.buckets (id, name, public)
values ('rental-vehicles', 'rental-vehicles', true)
on conflict (id) do nothing;

-- Lecture publique
create policy "Public read access to rental images"
  on storage.objects
  for select
  using (bucket_id = 'rental-vehicles');

-- Upload par le partenaire dans son dossier {userId}/
create policy "Partners can upload rental images to their folder"
  on storage.objects
  for insert
  with check (
    bucket_id = 'rental-vehicles'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- Mise à jour par le propriétaire
create policy "Partners can update their rental images"
  on storage.objects
  for update
  using (
    bucket_id = 'rental-vehicles'
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- Suppression par le propriétaire
create policy "Partners can delete their rental images"
  on storage.objects
  for delete
  using (
    bucket_id = 'rental-vehicles'
    and split_part(name, '/', 1) = auth.uid()::text
  );
