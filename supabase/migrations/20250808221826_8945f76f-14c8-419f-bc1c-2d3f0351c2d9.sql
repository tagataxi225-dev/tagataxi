
-- 1) Wallet utilisateur (Kwenda Pay)
create table if not exists public.user_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  balance numeric not null default 0,
  currency text not null default 'CDF',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_wallets enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_wallets' and policyname = 'Users can view their own wallets'
  ) then
    create policy "Users can view their own wallets"
      on public.user_wallets for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_wallets' and policyname = 'Users can create their own wallets'
  ) then
    create policy "Users can create their own wallets"
      on public.user_wallets for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_wallets' and policyname = 'Users can update their own wallets'
  ) then
    create policy "Users can update their own wallets"
      on public.user_wallets for update
      using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists user_wallets_user_id_idx on public.user_wallets(user_id);

drop trigger if exists set_user_wallets_updated_at on public.user_wallets;
create trigger set_user_wallets_updated_at
before update on public.user_wallets
for each row execute function public.update_updated_at_column();

-- 2) Historique des transactions Wallet
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  wallet_id uuid not null,
  transaction_type text not null, -- 'credit' | 'debit' | etc.
  amount numeric not null,
  currency text not null default 'CDF',
  description text not null,
  status text not null default 'completed', -- 'completed' | 'pending' | 'failed'
  payment_method text null,                 -- ex: 'airtel' | 'orange' | 'mpesa'
  reference_type text null,
  reference_id uuid null,
  balance_before numeric not null default 0,
  balance_after numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.wallet_transactions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'wallet_transactions' and policyname = 'Users can view their own wallet transactions'
  ) then
    create policy "Users can view their own wallet transactions"
      on public.wallet_transactions for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'wallet_transactions' and policyname = 'Users can insert their own wallet transactions'
  ) then
    create policy "Users can insert their own wallet transactions"
      on public.wallet_transactions for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists wallet_tx_user_id_created_at_idx on public.wallet_transactions(user_id, created_at desc);

-- 3) Transactions de paiement (Mobile Money)
create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount numeric not null,
  currency text not null default 'CDF',
  provider text not null,       -- 'airtel' | 'orange' | 'mpesa'
  phone text not null,
  status text not null default 'pending', -- 'pending' | 'completed' | 'failed'
  external_reference text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_transactions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'payment_transactions' and policyname = 'Users can view their own payment transactions'
  ) then
    create policy "Users can view their own payment transactions"
      on public.payment_transactions for select
      using (auth.uid() = user_id);
  end if;

  -- On autorise la création et la mise à jour par l'utilisateur si nécessaire,
  -- mais dans la pratique, l'Edge Function wallet-topup (service role) gère ces écritures.
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'payment_transactions' and policyname = 'Users can create their own payment transactions'
  ) then
    create policy "Users can create their own payment transactions"
      on public.payment_transactions for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'payment_transactions' and policyname = 'Users can update their own payment transactions'
  ) then
    create policy "Users can update their own payment transactions"
      on public.payment_transactions for update
      using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists payment_tx_user_id_created_at_idx on public.payment_transactions(user_id, created_at desc);

drop trigger if exists set_payment_transactions_updated_at on public.payment_transactions;
create trigger set_payment_transactions_updated_at
before update on public.payment_transactions
for each row execute function public.update_updated_at_column();

-- 4) Parrainage (Referrals)
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null,
  referral_code text not null,
  referred_id uuid null,
  status text not null default 'pending', -- 'pending' | 'completed' | 'cancelled'
  referred_user_type text null,          -- 'driver' | 'client' etc.
  completion_date timestamptz null,
  reward_given_date timestamptz null,
  created_at timestamptz not null default now()
);

-- code unique
create unique index if not exists referrals_referral_code_key on public.referrals(referral_code);

alter table public.referrals enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'referrals' and policyname = 'Users can view their own referrals'
  ) then
    create policy "Users can view their own referrals"
      on public.referrals for select
      using (auth.uid() = referrer_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'referrals' and policyname = 'Users can create their own referrals'
  ) then
    create policy "Users can create their own referrals"
      on public.referrals for insert
      with check (auth.uid() = referrer_id);
  end if;
end $$;

-- 5) Récompenses de parrainage
create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null,
  referrer_id uuid not null,
  tier_level text not null,           -- 'bronze' | 'silver' | 'gold' | 'platinum'
  reward_amount numeric not null,
  reward_currency text not null default 'CDF',
  created_at timestamptz not null default now()
);

alter table public.referral_rewards enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'referral_rewards' and policyname = 'Users can view their own referral rewards'
  ) then
    create policy "Users can view their own referral rewards"
      on public.referral_rewards for select
      using (auth.uid() = referrer_id);
  end if;
end $$;

create index if not exists referral_rewards_referrer_id_created_at_idx on public.referral_rewards(referrer_id, created_at desc);
