-- Schema MyMemo App - Fase 1 D2C
-- Da eseguire nel SQL Editor del progetto Supabase (Database > SQL Editor).

-- 1. Tabella profili (estende auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  subscription_active boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Un utente vede e modifica solo il proprio profilo"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Un utente aggiorna solo il proprio profilo"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Un utente crea solo il proprio profilo"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Crea automaticamente un profilo alla registrazione
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Tabella video/testimonianze
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  title text,
  visibility text not null default 'private' check (visibility in ('private', 'custode', 'public')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.videos enable row level security;

create policy "Il proprietario vede sempre i propri video"
  on public.videos for select
  using (auth.uid() = user_id);

create policy "Solo gli abbonati pubblicano video condivisi o pubblici"
  on public.videos for insert
  with check (
    auth.uid() = user_id
    and (
      visibility = 'private'
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.subscription_active = true
      )
    )
  );

create policy "Il proprietario aggiorna i propri video"
  on public.videos for update
  using (auth.uid() = user_id);

create policy "Il proprietario elimina i propri video"
  on public.videos for delete
  using (auth.uid() = user_id);

create policy "Gli abbonati vedono i video pubblici approvati"
  on public.videos for select
  using (
    visibility = 'public'
    and moderation_status = 'approved'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.subscription_active = true
    )
  );

-- 3. Tabella "mi piace"
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (video_id, user_id)
);

alter table public.likes enable row level security;

create policy "Chiunque puo' leggere il conteggio dei like"
  on public.likes for select
  using (true);

create policy "Solo abbonati mettono like"
  on public.likes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.subscription_active = true
    )
  );

create policy "Un utente rimuove solo il proprio like"
  on public.likes for delete
  using (auth.uid() = user_id);

-- 4. Tabella "condivisioni" (Share With Your Loved Ones)
create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  recipient_phone text not null,
  invite_token uuid not null default gen_random_uuid() unique,
  recipient_user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'claimed')),
  created_at timestamptz not null default now()
);

alter table public.shares enable row level security;

create policy "Il mittente vede le proprie condivisioni"
  on public.shares for select
  using (auth.uid() = owner_id);

create policy "Il destinatario vede le condivisioni ricevute"
  on public.shares for select
  using (auth.uid() = recipient_user_id);

create policy "Solo abbonati creano condivisioni dei propri video"
  on public.shares for insert
  with check (
    auth.uid() = owner_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.subscription_active = true
    )
    and exists (
      select 1 from public.videos v
      where v.id = video_id and v.user_id = auth.uid() and v.visibility = 'custode'
    )
  );

-- Ora che la tabella esiste, aggiungiamo la policy sui video che dipende da essa
create policy "Il destinatario vede i video condivisi con lui"
  on public.videos for select
  using (
    visibility = 'custode'
    and exists (
      select 1 from public.shares s
      where s.video_id = videos.id
        and s.recipient_user_id = auth.uid()
        and s.status = 'claimed'
    )
  );

-- 5. Storage: bucket privato per i video (crea dalla dashboard Storage se questo comando fallisce)
insert into storage.buckets (id, name, public)
values ('videos', 'videos', false)
on conflict (id) do nothing;

create policy "Upload solo nella propria cartella"
  on storage.objects for insert
  with check (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Lettura solo della propria cartella (le pubbliche passano da API con Service Role)"
  on storage.objects for select
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Eliminazione solo della propria cartella"
  on storage.objects for delete
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
