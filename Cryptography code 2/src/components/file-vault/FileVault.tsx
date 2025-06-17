import React, { useState, useEffect } from 'react';
import { FolderOpen, FileUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { encryptFile, decryptFile } from '../../lib/crypto/file';
import { importPublicKey, importPrivateKey, decryptSymmetricKey } from '../../lib/crypto/keys';
import { initializeUserKeys, getSharedFiles } from '../../lib/crypto/sharing';
import FileList from './FileList';
import ShareFileDialog from './ShareFileDialog';
import toast from 'react-hot-toast';
import { StoredFile } from '../../types/file';

export default function FileVault() {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sharingFile, setSharingFile] = useState<StoredFile | null>(null);

  useEffect(() => {
    initializeAndFetch();
  }, []);

  const initializeAndFetch = async () => {
    try {
      await initializeUserKeys();
      await fetchFiles();
    } catch (error: any) {
      console.error('Initialization error:', error);
      toast.error(error.message || 'Failed to initialize encryption');
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      // Get user's own files
      const { data: ownFiles, error: filesError } = await supabase
        .from('encrypted_files')
        .select('*')
        .eq('user_id', session.user.id);

      if (filesError) throw filesError;

      // Get shared files
      const sharedFiles = await getSharedFiles();

      // Combine own and shared files
      setFiles([
        ...(ownFiles || []).map(file => ({ ...file, shared: false })),
        ...sharedFiles.map(file => ({ ...file, shared: true }))
      ]);
    } catch (error: any) {
      console.error('Error fetching files:', error);
      toast.error(error.message || 'Failed to fetch files');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      // Get user's public key
      const { data: keyData, error: keyError } = await supabase
        .from('user_keypairs')
        .select('public_key')
        .eq('user_id', session.user.id)
        .single();

      if (keyError || !keyData?.public_key) {
        throw new Error('Encryption keys not found');
      }

      const publicKey = await importPublicKey(keyData.public_key);

      // Encrypt the file
      const { encryptedData, encryptedKey } = await encryptFile(file, publicKey);
      
      // Store the encrypted file
      const { data, error } = await supabase
        .from('encrypted_files')
        .insert([{
          user_id: session.user.id,
          filename: file.name,
          encrypted_data: encryptedData,
          encrypted_key: encryptedKey,
          size: file.size,
          type: file.type
        }])
        .select()
        .single();

      if (error) throw error;

      setFiles([{ ...data, shared: false }, ...files]);
      toast.success('File encrypted and stored securely');
      setFile(null);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (storedFile: StoredFile) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      let fileKey;
      if (storedFile.shared && storedFile.fileKey) {
        // For shared files, use the pre-decrypted key
        fileKey = storedFile.fileKey;
      } else {
        // For own files, decrypt the key
        const { data: keyData, error: keyError } = await supabase
          .from('user_keypairs')
          .select('encrypted_private_key')
          .eq('user_id', session.user.id)
          .single();

        if (keyError || !keyData?.encrypted_private_key) {
          throw new Error('Encryption keys not found');
        }

        const privateKey = await importPrivateKey(keyData.encrypted_private_key);
        fileKey = await decryptSymmetricKey(storedFile.encrypted_key, privateKey);
      }

      const decryptedData = await decryptFile(storedFile.encrypted_data, fileKey);
      const blob = new Blob([decryptedData], { type: storedFile.type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = storedFile.filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('File decrypted and downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast.error(error.message || 'Failed to decrypt file');
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
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast.error(error.message || 'Failed to delete file');
    }
  };

  const handleShare = (file: StoredFile) => {
    setSharingFile(file);
  };

  const handleShareComplete = () => {
    setSharingFile(null);
    fetchFiles();
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-8 max-w-xl w-full border border-primary-100">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary-100 rounded-lg">
          <FolderOpen className="w-6 h-6 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
          File Vault
        </h2>
      </div>

      <div className="space-y-6">
        <div className="border-2 border-dashed border-primary-200 rounded-xl p-8 text-center bg-primary-50/50 hover:bg-primary-50 transition-colors">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
            id="file-upload"
            accept="*/*"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <FileUp className="w-12 h-12 text-primary-400 mb-4" />
            <span className="text-gray-600 font-medium">
              {file ? file.name : 'Click to select a file'}
            </span>
            {file && (
              <span className="text-sm text-gray-500 mt-1">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            )}
          </label>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white py-2 rounded-lg hover:from-primary-700 hover:to-purple-700 flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg ${
            (!file || uploading) && 'opacity-50 cursor-not-allowed'
          }`}
        >
          <FileUp className="w-4 h-4" />
          {uploading ? 'Encrypting & Uploading...' : 'Upload Encrypted File'}
        </button>
        <p className="text-xs text-gray-500 text-center">
          Maximum file size: 10MB
        </p>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Stored Files</h3>
        <FileList
          files={files}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onShare={handleShare}
          loading={loading}
        />
      </div>

      {sharingFile && (
        <ShareFileDialog
          fileId={sharingFile.id}
          fileName={sharingFile.filename}
          onClose={handleShareComplete}
        />
      )}
    </div>
  );
}