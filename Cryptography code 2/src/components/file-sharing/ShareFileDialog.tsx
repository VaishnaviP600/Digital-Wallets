import React, { useState } from 'react';
import { Share2, X, Loader2 } from 'lucide-react';
import { shareFile } from '../../lib/crypto/sharing';
import toast from 'react-hot-toast';

interface ShareFileDialogProps {
  fileId: string;
  fileName: string;
  onClose: () => void;
  masterKey: CryptoKey;
}

export default function ShareFileDialog({ fileId, fileName, onClose, masterKey }: ShareFileDialogProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      await shareFile(fileId, email.trim(), masterKey);
      toast.success(`File shared with ${email}`);
      onClose();
    } catch (error: any) {
      console.error('Error sharing file:', error);
      toast.error(error.message || 'Failed to share file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share File
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Share "{fileName}" with another user
        </p>

        <form onSubmit={handleShare} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Recipient's Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
              placeholder="user@example.com"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              The recipient must have a verified account to receive shared files
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}