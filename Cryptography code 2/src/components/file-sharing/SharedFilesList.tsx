import React from 'react';
import { Share2, Download, Trash2, Users } from 'lucide-react';
import { StoredFile } from '../../types/file';

interface SharedFilesListProps {
  files: StoredFile[];
  onDownload: (file: StoredFile) => void;
  onShare: (file: StoredFile) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export default function SharedFilesList({
  files,
  onDownload,
  onShare,
  onDelete,
  loading = false
}: SharedFilesListProps) {
  if (loading) {
    return <div className="text-center text-gray-500">Loading files...</div>;
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No files stored yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.filename}
              </p>
              {file.shared && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                  <Users className="w-3 h-3 mr-1" />
                  Shared
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            {!file.shared && (
              <button
                onClick={() => onShare(file)}
                className="text-indigo-600 hover:text-indigo-700 p-1 rounded-full hover:bg-indigo-50 transition-colors"
                title="Share file"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onDownload(file)}
              className="text-blue-600 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition-colors"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>
            {!file.shared && (
              <button
                onClick={() => onDelete(file.id)}
                className="text-red-600 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                title="Delete file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}