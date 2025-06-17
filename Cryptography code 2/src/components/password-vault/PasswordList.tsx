import React, { useState } from 'react';
import { Eye, Pencil, Trash2, Info } from 'lucide-react';
import { StoredPassword } from '../../types/password';

interface PasswordListProps {
  passwords: StoredPassword[];
  onView: (password: StoredPassword) => void;
  onEdit: (password: StoredPassword) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export default function PasswordList({
  passwords,
  onView,
  onEdit,
  onDelete,
  loading = false
}: PasswordListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return <div className="text-center text-gray-500">Loading passwords...</div>;
  }

  if (passwords.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No passwords stored yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {passwords.map((item) => (
        <div
          key={item.id}
          className="bg-gray-50 rounded-lg overflow-hidden"
        >
          <div className="flex items-center justify-between p-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">{item.title}</h4>
              {item.note && (
                <button
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="mt-1 text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700"
                >
                  <Info className="w-3 h-3" />
                  View note
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => onView(item)}
                className="text-indigo-600 hover:text-indigo-700 p-1 rounded-full hover:bg-indigo-50 transition-colors"
                title="View password"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => onEdit(item)}
                className="text-blue-600 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition-colors"
                title="Edit password"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="text-red-600 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                title="Delete password"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          {expandedId === item.id && item.note && (
            <div className="px-3 pb-3 pt-1">
              <div className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
                {item.note}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}