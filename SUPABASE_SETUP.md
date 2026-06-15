# Supabase Setup

VinoPair can run fully in local browser storage, or use Supabase for accounts and cloud inVINtory sync.

## 1. Create Project

Create a Supabase project, then copy:

- Project URL
- Public anon key

Add them to Vercel:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## 2. Create Table

Run this SQL in Supabase SQL Editor:

```sql
create table if not exists public.vinopair_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  inventory jsonb not null default '[]'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.vinopair_profiles enable row level security;

create policy "Users can read their VinoPair profile"
on public.vinopair_profiles
for select
using (auth.uid() = user_id);

create policy "Users can insert their VinoPair profile"
on public.vinopair_profiles
for insert
with check (auth.uid() = user_id);

create policy "Users can update their VinoPair profile"
on public.vinopair_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

## 3. Auth

Enable email/password auth in Supabase Authentication settings.

If email confirmation is enabled, users may need to confirm before signing in.

## 4. App Behavior

- Without Supabase env vars: app stays in local mode.
- With Supabase env vars: Account tab enables sign in, create account, load cloud, save cloud, and autosave.
- Uploaded wine label images are stored in the profile JSON as data URLs for now.

For a large production cellar, move label images to Supabase Storage and store URLs in `label_image_url`.
