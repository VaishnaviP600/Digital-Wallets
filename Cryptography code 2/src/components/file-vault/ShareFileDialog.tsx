import React, { useState } from 'react';
import { Share2, X, Loader2, AlertCircle } from 'lucide-react';
import { shareFile } from '../../lib/crypto/sharing';
import toast from 'react-hot-toast';

interface ShareFileDialogProps {
  fileId: string;
  fileName: string;
  onClose: () => void;
}

export default function ShareFileDialog({ fileId, fileName, onClose }: ShareFileDialogProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    setLoading(true);
    
    try {
      await shareFile(fileId, email.trim());
      toast.success(
        'File shared successfully! The recipient will be able to access it when they log in.',
        { duration: 5000 }
      );
      onClose();
    } catch (error: any) {
      console.error('Error sharing file:', error);
      setError(
        error.message === 'Recipient not found or email not verified'
          ? 'This email address is not associated with a verified account'
          : error.message || 'Failed to share file'
      );
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

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleShare} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Recipient's Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
              placeholder="user@example.com"
              disabled={loading}
            />
            <div className="mt-2 text-sm text-gray-500 space-y-1">
              <p>Requirements for sharing:</p>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>Recipient must have a registered account</li>
                <li>Email address must be verified</li>
                <li>Files can be accessed when recipient logs in</li>
              </ul>
            </div>
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