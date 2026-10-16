-- UCAR ÜRETİM v0.1
-- Supabase SQL Editor'da çalıştırın. Önce projeyi ve Auth kullanıcılarını oluşturun.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'sales'
    check (role in ('sales','production','manager','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.production_requests (
  id uuid primary key default gen_random_uuid(),
  product_code text not null check (length(product_code) between 1 and 80),
  product_name text not null default '',
  requested_quantity integer not null check (requested_quantity between 1 and 100000),
  suggested_quantity integer check (suggested_quantity >= 0),
  stock_on_hand numeric check (stock_on_hand >= 0),
  sales_30d numeric check (sales_30d >= 0),
  last_receipt_date date,
  last_receipt_quantity numeric check (last_receipt_quantity >= 0),
  velocity text not null default 'unknown' check (velocity in ('green','yellow','red','unknown')),
  priority text not null default 'normal' check (priority in ('urgent','normal','low')),
  status text not null default 'pending_review'
    check (status in ('pending_review','approved','in_production','completed','rejected')),
  notes text not null default '',
  decision_note text,
  requested_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists production_requests_status_idx
  on public.production_requests(status, created_at desc);
create index if not exists production_requests_product_idx
  on public.production_requests(product_code, created_at desc);

create table if not exists public.production_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.production_requests(id) on delete cascade,
  actor_id uuid references auth.users(id),
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists production_events_request_idx
  on public.production_events(request_id, created_at);

-- Anonim/normal client yazamamalı; tek yazma noktası yetki kontrolü yapan API.
alter table public.profiles enable row level security;
alter table public.production_requests enable row level security;
alter table public.production_events enable row level security;

drop policy if exists "profile owner can read" on public.profiles;
create policy "profile owner can read" on public.profiles
  for select to authenticated using (auth.uid() = id);
-- production_requests ve production_events için client policy YOK:
-- sadece sunucu tarafında service_role ile erişilir.

create or replace function public.ucar_set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ucar_requests_updated on public.production_requests;
create trigger ucar_requests_updated
before update on public.production_requests
for each row execute function public.ucar_set_updated_at();

-- Oluşturma ve durum değişikliği aynı DB işleminde loglanır.
create or replace function public.ucar_log_request()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.production_events(request_id, actor_id, event_type, details)
    values(new.id, new.requested_by, 'created',
      jsonb_build_object('status',new.status,'quantity',new.requested_quantity,'product_code',new.product_code));
  elsif old.status is distinct from new.status then
    insert into public.production_events(request_id, actor_id, event_type, details)
    values(new.id, new.updated_by, 'status_changed',
      jsonb_build_object('from',old.status,'to',new.status,'note',new.decision_note));
  end if;
  return new;
end;
$$;

drop trigger if exists ucar_requests_audit on public.production_requests;
create trigger ucar_requests_audit
after insert or update on public.production_requests
for each row execute function public.ucar_log_request();

create or replace function public.ucar_profile_on_signup()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name, role)
  values(new.id, coalesce(new.raw_user_meta_data ->> 'full_name',split_part(new.email,'@',1),''), 'sales')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists ucar_auth_user_created on auth.users;
create trigger ucar_auth_user_created
after insert on auth.users
for each row execute function public.ucar_profile_on_signup();

-- Önceden açılmış kullanıcı varsa:
insert into public.profiles(id,display_name,role)
select id,coalesce(raw_user_meta_data ->> 'full_name',split_part(email,'@',1),''),'sales'
from auth.users on conflict(id) do nothing;

-- Roller kurulumdan sonra yönetici tarafından SQL üzerinden atanır:
-- update public.profiles set role='manager' where id='<auth-uuid>';
