-- 1. Create a table for public profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  email text
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 3. Create Policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 4. Create a Trigger to handle new user signups
-- This ensures a row exists in public.profiles when a user is created in auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, '');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Storage Bucket for Avatars
-- Note: You might need to create the 'avatars' bucket manually in the dashboard if this fails, 
-- but this SQL attempts to set up policies assuming the bucket exists or will be created.
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

create policy "Anyone can update their own avatar."
  on storage.objects for update
  using ( bucket_id = 'avatars' AND auth.uid() = owner );
