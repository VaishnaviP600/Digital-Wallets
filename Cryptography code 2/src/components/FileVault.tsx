import React, { useState, useEffect } from 'react';
import { FileUp, FolderOpen, Download, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { encryptFile, decryptFile } from '../lib/crypto/file';
import { generateMasterKey, exportKey, importKey } from '../lib/crypto/keys';
import toast from 'react-hot-toast';

interface StoredFile {
  id: string;
  filename: string;
  size: number;
  type: string;
  encrypted_data: string;
}

export default function FileVault() {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);

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
      await fetchFiles();
    } catch (error) {
      console.error('Error initializing master key:', error);
      toast.error('Failed to initialize encryption');
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('encrypted_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to fetch files');
    }
  };

  const handleUpload = async () => {
    if (!file || !masterKey) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const encryptedData = await encryptFile(file, masterKey);
      
      const { data, error } = await supabase
        .from('encrypted_files')
        .insert([{
          user_id: session.user.id,
          filename: file.name,
          encrypted_data: encryptedData,
          size: file.size,
          type: file.type
        }])
        .select()
        .single();

      if (error) throw error;

      setFiles([data, ...files]);
      toast.success('File encrypted and stored securely');
      setFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (storedFile: StoredFile) => {
    if (!masterKey) {
      toast.error('Encryption key not initialized');
      return;
    }

    try {
      const decryptedData = await decryptFile(storedFile.encrypted_data, masterKey);
      const blob = new Blob([decryptedData], { type: storedFile.type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = storedFile.filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to decrypt file');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('encrypted_files')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFiles(files.filter((f) => f.id !== id));
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-xl w-full">
      <div className="flex items-center gap-2 mb-6">
        <FolderOpen className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-800">File Vault</h2>
      </div>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <FileUp className="w-12 h-12 text-gray-400 mb-4" />
            <span className="text-gray-600">
              {file ? file.name : 'Click to select a file'}
            </span>
          </label>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 ${
            (!file || uploading) && 'opacity-50 cursor-not-allowed'
          }`}
        >
          <FileUp className="w-4 h-4" />
          {uploading ? 'Encrypting & Uploading...' : 'Upload Encrypted File'}
        </button>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Stored Files</h3>
        {loading ? (
          <div className="text-center text-gray-500">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No files stored yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((storedFile) => (
              <div
                key={storedFile.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {storedFile.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(storedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleDownload(storedFile)}
                    className="text-blue-600 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition-colors"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(storedFile.id)}
                    className="text-red-600 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                    title="Delete file"
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