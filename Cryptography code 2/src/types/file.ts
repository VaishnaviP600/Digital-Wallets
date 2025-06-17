export interface StoredFile {
  id: string;
  filename: string;
  size: number;
  type: string;
  encrypted_data: string;
  shared?: boolean;
}

export interface FileShare {
  id: string;
  file_id: string;
  owner_id: string;
  shared_with_id: string;
  encrypted_key: string;
  created_at: string;
}