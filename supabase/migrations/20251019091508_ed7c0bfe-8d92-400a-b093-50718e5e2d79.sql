-- Table pour stocker les comptes liés d'un utilisateur
create table if not exists public.user_accounts (
  id uuid primary key default gen_random_uuid(),
  primary_user_id uuid references auth.users(id) on delete cascade not null,
  linked_email text not null,
  display_name text,
  avatar_url text,
  is_active boolean default false,
  last_accessed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(primary_user_id, linked_email)
);

-- Index pour performance
create index idx_user_accounts_primary_user on public.user_accounts(primary_user_id);
create index idx_user_accounts_active on public.user_accounts(primary_user_id, is_active);

-- Enable RLS
alter table public.user_accounts enable row level security;

-- RLS Policies
create policy "Users can view their own linked accounts"
  on public.user_accounts
  for select
  to authenticated
  using (auth.uid() = primary_user_id);

create policy "Users can insert their own linked accounts"
  on public.user_accounts
  for insert
  to authenticated
  with check (auth.uid() = primary_user_id);

create policy "Users can update their own linked accounts"
  on public.user_accounts
  for update
  to authenticated
  using (auth.uid() = primary_user_id)
  with check (auth.uid() = primary_user_id);

create policy "Users can delete their own linked accounts"
  on public.user_accounts
  for delete
  to authenticated
  using (auth.uid() = primary_user_id);

-- Trigger pour updated_at
create or replace function public.update_user_accounts_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_user_accounts_updated_at
  before update on public.user_accounts
  for each row
  execute function public.update_user_accounts_updated_at();