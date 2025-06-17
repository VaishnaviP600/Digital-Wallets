-- Drop the file_shares table if it exists (to ensure clean state)
drop table if exists public.file_shares cascade;

-- Create file_shares table
create table if not exists public.file_shares (
  id uuid default gen_random_uuid() primary key,
  file_id uuid references public.encrypted_files(id) on delete cascade,
  owner_id uuid references auth.users(id) not null,
  shared_with_id uuid references auth.users(id) not null,
  encrypted_key text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(file_id, shared_with_id)
);

-- Enable RLS on file_shares
alter table public.file_shares enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view shared files" on public.file_shares;
drop policy if exists "Users can insert shared files" on public.file_shares;
drop policy if exists "Users can delete shared files" on public.file_shares;

-- Update the view policy for encrypted_files to include shared files
drop policy if exists "Users can view their own files" on public.encrypted_files;
create policy "Users can view their own files"
  on public.encrypted_files for select
  using (
    auth.uid() = user_id or 
    exists (
      select 1 from public.file_shares 
      where file_id = encrypted_files.id 
      and shared_with_id = auth.uid()
    )
  );

-- Create policies for file_shares
create policy "Users can view shared files"
  on public.file_shares for select
  using (auth.uid() = shared_with_id or auth.uid() = owner_id);

create policy "Users can insert shared files"
  on public.file_shares for insert
  with check (
    auth.uid() = owner_id and
    exists (
      select 1 from public.encrypted_files
      where id = file_id and user_id = auth.uid()
    )
  );

create policy "Users can delete shared files"
  on public.file_shares for delete
  using (auth.uid() = owner_id);

-- Create or replace the get_user_id_by_email function
create or replace function get_user_id_by_email(email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  user_id uuid;
begin
  select id into user_id
  from auth.users
  where auth.users.email = get_user_id_by_email.email
  and auth.users.confirmed_at is not null;
  
  return user_id;
end;
$$;

-- Grant execute permissions
grant execute on function get_user_id_by_email(text) to authenticated;

-- Create indexes for better performance
create index if not exists idx_file_shares_file_id on public.file_shares(file_id);
create index if not exists idx_file_shares_shared_with_id on public.file_shares(shared_with_id);
create index if not exists idx_file_shares_owner_id on public.file_shares(owner_id);

-- Refresh the schema cache
notify pgrst, 'reload schema';