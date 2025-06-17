import React, { useState, useEffect } from 'react';
import { Lock, Plus, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { encryptPassword, decryptPassword } from '../../lib/crypto/encryption';
import { generateMasterKey, exportKey, importKey } from '../../lib/crypto/keys';
import PasswordInput from './PasswordInput';
import PasswordList from './PasswordList';
import toast from 'react-hot-toast';
import { StoredPassword } from '../../types/password';

export default function PasswordVault() {
  const [passwords, setPasswords] = useState<StoredPassword[]>([]);
  const [title, setTitle] = useState('');
  const [password, setPassword] = useState('');
  const [note, setNote] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingPassword, setEditingPassword] = useState<StoredPassword | null>(null);

  useEffect(() => {
    initializeMasterKey();
  }, []);

  const initializeMasterKey = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

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
        key = await generateMasterKey();
        const exportedKey = await exportKey(key);

        const { error: insertError } = await supabase
          .from('user_keys')
          .insert([{ 
            user_id: session.user.id,
            key_data: exportedKey 
          }]);

        if (insertError) throw insertError;
      } else {
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

  const fetchPasswords = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('passwords')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPasswords(
        data.map((item) => ({
          id: item.id,
          title: item.title,
          encryptedPassword: item.encrypted_password,
          note: item.note
        }))
      );
    } catch (error) {
      console.error('Error fetching passwords:', error);
      toast.error('Failed to fetch passwords');
    }
  };

  const handleSubmit = async () => {
    if (!title || !password || !masterKey) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const encryptedPass = await encryptPassword(password, masterKey);

      if (editingPassword) {
        const { error } = await supabase
          .from('passwords')
          .update({ 
            title, 
            encrypted_password: encryptedPass,
            note: note.trim() || null
          })
          .eq('id', editingPassword.id);

        if (error) throw error;

        setPasswords(passwords.map(p => 
          p.id === editingPassword.id 
            ? {
                id: editingPassword.id,
                title,
                encryptedPassword: encryptedPass,
                note: note.trim() || undefined
              }
            : p
        ));

        toast.success('Password updated successfully');
        setEditingPassword(null);
      } else {
        const { data, error } = await supabase
          .from('passwords')
          .insert([{ 
            user_id: session.user.id,
            title, 
            encrypted_password: encryptedPass,
            note: note.trim() || null
          }])
          .select();

        if (error) throw error;

        setPasswords([
          {
            id: data[0].id,
            title,
            encryptedPassword: encryptedPass,
            note: note.trim() || undefined
          },
          ...passwords,
        ]);

        toast.success('Password stored securely');
      }

      setTitle('');
      setPassword('');
      setNote('');
      setShowPassword(false);
    } catch (error) {
      console.error('Error saving password:', error);
      toast.error(`Failed to ${editingPassword ? 'update' : 'store'} password`);
    }
  };

  const handleEdit = async (storedPassword: StoredPassword) => {
    if (!masterKey) {
      toast.error('Encryption key not initialized');
      return;
    }

    try {
      const decryptedPassword = await decryptPassword(storedPassword.encryptedPassword, masterKey);
      setEditingPassword(storedPassword);
      setTitle(storedPassword.title);
      setPassword(decryptedPassword);
      setNote(storedPassword.note || '');
      setShowPassword(false);
    } catch (error) {
      console.error('Error preparing password for edit:', error);
      toast.error('Failed to load password for editing');
    }
  };

  const handleView = async (storedPassword: StoredPassword) => {
    if (!masterKey) {
      toast.error('Encryption key not initialized');
      return;
    }

    try {
      const decryptedPassword = await decryptPassword(storedPassword.encryptedPassword, masterKey);
      toast.success(`Password: ${decryptedPassword}`, {
        duration: 3000,
        position: 'bottom-center',
      });
    } catch (error) {
      console.error('Error decrypting password:', error);
      toast.error('Failed to decrypt password');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('passwords')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPasswords(passwords.filter((p) => p.id !== id));
      toast.success('Password deleted successfully');
    } catch (error) {
      console.error('Error deleting password:', error);
      toast.error('Failed to delete password');
    }
  };

  const handleCancel = () => {
    setEditingPassword(null);
    setTitle('');
    setPassword('');
    setNote('');
    setShowPassword(false);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-8 max-w-xl w-full border border-primary-100">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary-100 rounded-lg">
          <Lock className="w-6 h-6 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
          Password Vault
        </h2>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                placeholder="e.g., Gmail Account"
                className="w-full px-4 py-2 bg-white border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <PasswordInput
                value={password}
                onChange={setPassword}
                showPassword={showPassword}
                onToggleVisibility={() => setShowPassword(!showPassword)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
              Note <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="note"
              placeholder="Add any additional information..."
              className="w-full px-4 py-2 bg-white border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-[104px] resize-none transition-colors"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-primary-600 to-purple-600 text-white py-2 rounded-lg hover:from-primary-700 hover:to-purple-700 flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            {editingPassword ? (
              <>
                <Pencil className="w-4 h-4" />
                Update Password
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Password
              </>
            )}
          </button>
          {editingPassword && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          Stored Passwords
          {passwords.length > 0 && (
            <span className="text-sm font-normal text-gray-500">
              ({passwords.length} {passwords.length === 1 ? 'entry' : 'entries'})
            </span>
          )}
        </h3>
        <PasswordList
          passwords={passwords}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </div>
    </div>
  );
}