export interface Tables {
  passwords: {
    id: string;
    user_id: string;
    title: string;
    encrypted_password: string;
    note?: string;
    created_at: string;
  };
  encrypted_files: {
    id: string;
    user_id: string;
    filename: string;
    encrypted_data: string;
    size: number;
    type: string;
    created_at: string;
  };
  user_keys: {
    id: string;
    user_id: string;
    key_data: string;
    created_at: string;
  };
  file_shares: {
    id: string;
    file_id: string;
    owner_id: string;
    shared_with_id: string;
    encrypted_key: string;
    created_at: string;
  };
}

/*
SQL Setup Instructions:

-- Enable Row Level Security
ALTER TABLE public.passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encrypted_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;

-- Create passwords table
CREATE TABLE public.passwords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create encrypted_files table
CREATE TABLE public.encrypted_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  filename TEXT NOT NULL,
  encrypted_data TEXT NOT NULL,
  size BIGINT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_keys table
CREATE TABLE public.user_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  key_data TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
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

-- Create RLS policies
CREATE POLICY "Users can insert their own passwords"
  ON public.passwords FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own passwords"
  ON public.passwords FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own passwords"
  ON public.passwords FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own passwords"
  ON public.passwords FOR DELETE
  USING (auth.uid() = user_id);

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

CREATE POLICY "Users can insert their own key"
  ON public.user_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own key"
  ON public.user_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own key"
  ON public.user_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own key"
  ON public.user_keys FOR DELETE
  USING (auth.uid() = user_id);

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

-- Create indexes
CREATE INDEX idx_passwords_user_id ON public.passwords(user_id);
CREATE INDEX idx_encrypted_files_user_id ON public.encrypted_files(user_id);
CREATE INDEX idx_user_keys_user_id ON public.user_keys(user_id);
CREATE INDEX idx_file_shares_file_id ON public.file_shares(file_id);
CREATE INDEX idx_file_shares_shared_with_id ON public.file_shares(shared_with_id);
CREATE INDEX idx_file_shares_owner_id ON public.file_shares(owner_id);
*/