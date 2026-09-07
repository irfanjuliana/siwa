-- =============================================================
-- SIWA - Sistem Informasi Wali Asrama
-- Database schema & relations
-- =============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- -------------------------------------------------------------
-- USERS (pegawai)
-- -------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  nip         text unique not null,
  password    text not null,          -- hashed (bcrypt)
  nama        text not null,
  jabatan     text not null,          -- 'wali asrama' | 'wali asuh'
  role        text not null default 'user',  -- 'admin' | 'user'
  foto_url    text,
  created_at  timestamptz not null default now()
);

-- -------------------------------------------------------------
-- RHK (master: RHK 1..6)
-- -------------------------------------------------------------
create table if not exists public.rhk (
  id         uuid primary key default gen_random_uuid(),
  nomor      int not null,
  nama_rhk   text not null unique,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- RHK AKTIVITAS / KEGIATAN (dropdown options per RHK)
-- -------------------------------------------------------------
create table if not exists public.rhk_aktivitas (
  id         uuid primary key default gen_random_uuid(),
  rhk_id     uuid not null references public.rhk(id) on delete cascade,
  nama       text not null,
  created_at timestamptz not null default now(),
  unique (rhk_id, nama)
);

-- -------------------------------------------------------------
-- RHK HASIL TINDAK LANJUT (dropdown options per RHK)
-- -------------------------------------------------------------
create table if not exists public.rhk_hasil (
  id         uuid primary key default gen_random_uuid(),
  rhk_id     uuid not null references public.rhk(id) on delete cascade,
  nama       text not null,
  created_at timestamptz not null default now(),
  unique (rhk_id, nama)
);

-- -------------------------------------------------------------
-- PENGISIAN RHK (data kegiatan yang disimpan user)
-- -------------------------------------------------------------
create table if not exists public.pengisian_rhk (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  tanggal_kegiatan    date not null,
  waktu_kegiatan      time not null,
  pilih_rhk_id        uuid references public.rhk(id) on delete set null,
  pilih_rhk_text      text,
  aktivitas_id        uuid references public.rhk_aktivitas(id) on delete set null,
  aktivitas_kegiatan  text,           -- dari dropdown atau manual
  hasil_tl            text,           -- dari dropdown atau manual
  url_foto            text,
  created_at          timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_pengisian_rhk_user on public.pengisian_rhk(user_id);
create index if not exists idx_rhk_aktivitas_rhk on public.rhk_aktivitas(rhk_id);
create index if not exists idx_rhk_hasil_rhk on public.rhk_hasil(rhk_id);

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (permissive so the app works simply)
-- -------------------------------------------------------------
alter table public.users        enable row level security;
alter table public.rhk          enable row level security;
alter table public.rhk_aktivitas enable row level security;
alter table public.rhk_hasil    enable row level security;
alter table public.pengisian_rhk enable row level security;

create policy "users anon all"      on public.users         for all to anon, authenticated using (true) with check (true);
create policy "rhk anon all"        on public.rhk           for all to anon, authenticated using (true) with check (true);
create policy "rhk_aktivitas anon all" on public.rhk_aktivitas for all to anon, authenticated using (true) with check (true);
create policy "rhk_hasil anon all"  on public.rhk_hasil     for all to anon, authenticated using (true) with check (true);
create policy "pengisian_rhk anon all" on public.pengisian_rhk for all to anon, authenticated using (true) with check (true);

-- -------------------------------------------------------------
-- SEED: default RHK 1..6
-- -------------------------------------------------------------
insert into public.rhk (nomor, nama_rhk) values
  (1, 'RHK 1'),
  (2, 'RHK 2'),
  (3, 'RHK 3'),
  (4, 'RHK 4'),
  (5, 'RHK 5'),
  (6, 'RHK 6')
on conflict (nama_rhk) do nothing;
