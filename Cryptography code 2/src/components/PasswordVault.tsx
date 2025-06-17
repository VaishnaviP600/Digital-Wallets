import React, { useState, useEffect } from 'react';
import { Lock, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { encryptMessage, decryptMessage, generateMasterKey, exportKey, importKey } from '../lib/crypto';
import toast from 'react-hot-toast';

interface StoredPassword {
  id: string;
  title: string;
  encryptedPassword: string;
}

export default function PasswordVault() {
  const [passwords, setPasswords] = useState<StoredPassword[]>([]);
  const [title, setTitle] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeMasterKey();
  }, []);

  const initializeMasterKey = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No authenticated user');
      }

      // Try to get the existing master key from the database
      const { data: keyData, error: keyError } = await supabase
        .from('user_keys')
        .select('key_data')
        .eq('user_id', session.user.id)
        .single();

      if (keyError && keyError.code !== 'PGRST116') {
        throw keyError;
      }

      let key: CryptoKey;
      if (!keyData) {
        // Generate a new master key if none exists
        key = await generateMasterKey();
        const exportedKey = await exportKey(key);

        // Store the key in the database with user_id
        const { error: insertError } = await supabase
          .from('user_keys')
          .insert([{ 
            user_id: session.user.id,
            key_data: exportedKey 
          }]);

        if (insertError) throw insertError;
      } else {
        // Import the existing key
        key = await importKey(keyData.key_data);
      }

      setMasterKey(key);
      await fetchPasswords();
    } catch (error) {
      console.error('Error initializing master key:', error);
      toast.error('Failed to initialize encryption');
    } finally {
      setLoading(false);
    }
  };

  // Rest of the component remains the same
  const fetchPasswords = async () => {
    try {
      const { data, error } = await supabase
        .from('passwords')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPasswords(
        data.map((item) => ({
          id: item.id,
          title: item.title,
          encryptedPassword: item.encrypted_password,
        }))
      );
    } catch (error) {
      toast.error('Failed to fetch passwords');
    }
  };

  const addPassword = async () => {
    if (!title || !password || !masterKey) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const encryptedPass = await encryptMessage(password, masterKey);
      const { data, error } = await supabase
        .from('passwords')
        .insert([{ title, encrypted_password: encryptedPass }])
        .select();

      if (error) throw error;

      setPasswords([
        {
          id: data[0].id,
          title,
          encryptedPassword: encryptedPass,
        },
        ...passwords,
      ]);

      toast.success('Password stored securely');
      setTitle('');
      setPassword('');
    } catch (error) {
      toast.error('Failed to store password');
    }
  };

  const deletePassword = async (id: string) => {
    try {
      const { error } = await supabase.from('passwords').delete().eq('id', id);
      if (error) throw error;

      setPasswords(passwords.filter((p) => p.id !== id));
      toast.success('Password deleted successfully');
    } catch (error) {
      toast.error('Failed to delete password');
    }
  };

  const viewPassword = async (encryptedPassword: string) => {
    if (!masterKey) {
      toast.error('Encryption key not initialized');
      return;
    }

    try {
      const decryptedPassword = await decryptMessage(encryptedPassword, masterKey);
      toast.success(`Password: ${decryptedPassword}`, {
        duration: 3000,
        position: 'bottom-center',
      });
    } catch (error) {
      toast.error('Failed to decrypt password');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
      <div className="flex items-center gap-2 mb-6">
        <Lock className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-800">Password Vault</h2>
      </div>

      <div className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Title"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={addPassword}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Password
        </button>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Stored Passwords</h3>
        {loading ? (
          <div className="text-center text-gray-500">Loading passwords...</div>
        ) : (
          <div className="space-y-2">
            {passwords.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium text-gray-700">{item.title}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => viewPassword(item.encryptedPassword)}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deletePassword(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}