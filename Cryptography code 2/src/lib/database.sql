-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.file_shares CASCADE;
DROP TABLE IF EXISTS public.encrypted_files CASCADE;
DROP TABLE IF EXISTS public.user_keypairs CASCADE;

-- Create user_keypairs table
CREATE TABLE public.user_keypairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  public_key TEXT NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Create encrypted_files table
CREATE TABLE public.encrypted_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  filename TEXT NOT NULL,
  encrypted_data TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  size BIGINT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create file_shares table
CREATE TABLE public.file_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES public.encrypted_files(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  shared_with_id UUID REFERENCES auth.users(id) NOT NULL,
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(file_id, shared_with_id)
);

-- Enable RLS
ALTER TABLE public.user_keypairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encrypted_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;

-- Create policies for user_keypairs
CREATE POLICY "Users can insert their own keypair"
  ON public.user_keypairs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own keypair"
  ON public.user_keypairs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public keys"
  ON public.user_keypairs FOR SELECT
  USING (true);

-- Create policies for encrypted_files
CREATE POLICY "Users can insert their own files"
  ON public.encrypted_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own and shared files"
  ON public.encrypted_files FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.file_shares 
      WHERE file_id = encrypted_files.id 
      AND shared_with_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own files"
  ON public.encrypted_files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
  ON public.encrypted_files FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for file_shares
CREATE POLICY "Users can view shared files"
  ON public.file_shares FOR SELECT
  USING (auth.uid() = shared_with_id OR auth.uid() = owner_id);

CREATE POLICY "Users can insert shared files"
  ON public.file_shares FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (
      SELECT 1 FROM public.encrypted_files
      WHERE id = file_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete shared files"
  ON public.file_shares FOR DELETE
  USING (auth.uid() = owner_id);

-- Function to get user ID from email
CREATE OR REPLACE FUNCTION get_user_id_by_email(email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id
  FROM auth.users
  WHERE auth.users.email = get_user_id_by_email.email
  AND auth.users.confirmed_at IS NOT NULL;
  
  RETURN user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_id_by_email(TEXT) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_encrypted_files_user_id ON public.encrypted_files(user_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON public.file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with_id ON public.file_shares(shared_with_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_owner_id ON public.file_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_keypairs_user_id ON public.user_keypairs(user_id);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';