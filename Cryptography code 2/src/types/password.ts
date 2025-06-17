export interface StoredPassword {
  id: string;
  title: string;
  encryptedPassword: string;
  note?: string;
}