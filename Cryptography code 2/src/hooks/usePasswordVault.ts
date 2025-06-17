import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { encryptPassword, decryptPassword } from '../lib/crypto/encryption';
import toast from 'react-hot-toast';

interface StoredPassword {
  id: string;
  title: string;
  encryptedPassword: string;
}

export function usePasswordVault() {
  const [passwords, setPasswords] = useState<StoredPassword[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPasswords();
  }, []);

  const fetchPasswords = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('passwords')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPasswords(
        data.map((item) => ({
          id: item.id,
          title: item.title,
          encryptedPassword: item.encrypted_password
        }))
      );
    } catch (error) {
      console.error('Error fetching passwords:', error);
      toast.error('Failed to fetch passwords');
    } finally {
      setLoading(false);
    }
  };

  const addPassword = async (title: string, password: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const encryptedPassword = await encryptPassword(password);
      
      const { data, error } = await supabase
        .from('passwords')
        .insert([{
          user_id: user.id,
          title,
          encrypted_password: encryptedPassword
        }])
        .select();

      if (error) throw error;

      setPasswords([
        {
          id: data[0].id,
          title,
          encryptedPassword
        },
        ...passwords
      ]);

      toast.success('Password stored securely');
      return true;
    } catch (error) {
      console.error('Error adding password:', error);
      toast.error('Failed to store password');
      return false;
    }
  };

  const deletePassword = async (id: string) => {
    try {
      const { error } = await supabase
        .from('passwords')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPasswords(passwords.filter((p) => p.id !== id));
      toast.success('Password deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting password:', error);
      toast.error('Failed to delete password');
      return false;
    }
  };

  const viewPassword = async (password: StoredPassword) => {
    try {
      const decrypted = await decryptPassword(password.encryptedPassword);
      return decrypted;
    } catch (error) {
      console.error('Error viewing password:', error);
      toast.error('Failed to decrypt password');
      return null;
    }
  };

  return {
    passwords,
    loading,
    addPassword,
    deletePassword,
    viewPassword
  };
}