-- First drop the existing policy
drop policy if exists "Users can view their shared files" on public.file_shares;

-- Then create the updated policy
create policy "Users can view their shared files"
  on public.file_shares for select
  using (auth.uid() = shared_with_id or auth.uid() = owner_id);

-- Add the transaction function for atomic file sharing
create or replace function public.share_file_transaction(
  p_file_id uuid,
  p_encrypted_data text,
  p_owner_id uuid,
  p_recipient_id uuid,
  p_encrypted_key text
) returns void
security definer
set search_path = public
language plpgsql
as $$
begin
  -- Update the file's encrypted data
  update encrypted_files
  set encrypted_data = p_encrypted_data
  where id = p_file_id and user_id = p_owner_id;

  -- Create the share record
  insert into file_shares (
    file_id,
    owner_id,
    shared_with_id,
    encrypted_key
  ) values (
    p_file_id,
    p_owner_id,
    p_recipient_id,
    p_encrypted_key
  );
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.share_file_transaction(uuid, text, uuid, uuid, text) to authenticated;

-- Refresh the schema cache
notify pgrst, 'reload schema';