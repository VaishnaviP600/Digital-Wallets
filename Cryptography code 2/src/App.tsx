import React, { useState, useEffect } from 'react';
import { Shield, LogOut, FolderOpen, Lock, FileText, Code } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import PasswordVault from './components/password-vault/PasswordVault';
import FileVault from './components/file-vault/FileVault';
import TextEncryption from './components/text-encryption/TextEncryption';
import AuthForm from './components/AuthForm';
import ResetPassword from './components/ResetPassword';
import { useAuth, signOut } from './lib/auth';
import toast from 'react-hot-toast';

type Tab = 'passwords' | 'files' | 'text';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('passwords');

  useEffect(() => {
    checkSession();
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsResetPassword(true);
    }
  }, []);

  const checkSession = async () => {
    try {
      const {
        data: { session },
      } = await useAuth();
      setSession(session);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setSession(null);
    toast.success('Signed out successfully');
  };

  const handleResetSuccess = () => {
    setIsResetPassword(false);
    toast.success(
      'Password reset successful. Please sign in with your new password.'
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
        <div className="animate-pulse text-indigo-600">Loading...</div>
      </div>
    );
  }

  if (isResetPassword) {
    return (
      <>
        <Toaster position="top-right" />
        <ResetPassword onSuccess={handleResetSuccess} />
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Toaster position="top-right" />
        <AuthForm onAuthSuccess={checkSession} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
      <Toaster position="top-right" />

      <nav className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                CryptoWallet
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {session.user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex justify-center space-x-4">
            <button
              onClick={() => setActiveTab('passwords')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                activeTab === 'passwords'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Passwords</span>
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                activeTab === 'files'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>Files</span>
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                activeTab === 'text'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Text Encryption</span>
            </button>
          </div>

          <div className="flex justify-center">
            {activeTab === 'passwords' ? (
              <PasswordVault />
            ) : activeTab === 'files' ? (
              <FileVault />
            ) : (
              <TextEncryption />
            )}
          </div>
        </div>
      </main>

      <footer className="mt-auto py-4 bg-white/50 backdrop-blur-sm border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Code className="w-4 h-4 mr-2" />
            <span>Developed by Teja & Vaishnavi</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
