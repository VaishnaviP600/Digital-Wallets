import React, { useState } from 'react';
import { Lock, Unlock, Copy, Check, RefreshCw } from 'lucide-react';
import { encryptText, decryptText, EncryptionAlgorithm } from '../../lib/crypto/text';
import toast from 'react-hot-toast';

const algorithms: { value: EncryptionAlgorithm; label: string }[] = [
  { value: 'AES', label: 'AES-256 (Advanced Encryption Standard)' },
  { value: 'caesar', label: 'Caesar Cipher' },
  { value: 'vigenere', label: 'Vigenère Cipher' },
  { value: 'base64', label: 'Base64 Encoding' },
];

export default function TextEncryption() {
  const [text, setText] = useState('');
  const [key, setKey] = useState('');
  const [algorithm, setAlgorithm] = useState<EncryptionAlgorithm>('AES');
  const [result, setResult] = useState('');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleProcess = async () => {
    if (!text) {
      toast.error('Please enter some text');
      return;
    }

    if (algorithm !== 'base64' && !key) {
      toast.error('Please enter a key');
      return;
    }

    setLoading(true);
    try {
      const processedText = mode === 'encrypt'
        ? await encryptText(text, algorithm, key)
        : await decryptText(text, algorithm, key);
      
      setResult(processedText);
      toast.success(`Text ${mode === 'encrypt' ? 'encrypted' : 'decrypted'} successfully`);
    } catch (error: any) {
      console.error('Processing error:', error);
      toast.error(error.message || `Failed to ${mode} text`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwap = () => {
    setText(result);
    setResult('');
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-8 max-w-xl w-full border border-primary-100">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary-100 rounded-lg">
          {mode === 'encrypt' ? (
            <Lock className="w-6 h-6 text-primary-600" />
          ) : (
            <Unlock className="w-6 h-6 text-primary-600" />
          )}
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
          Text {mode === 'encrypt' ? 'Encryption' : 'Decryption'}
        </h2>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mode
            </label>
            <div className="flex rounded-lg overflow-hidden border border-primary-200">
              <button
                onClick={() => setMode('encrypt')}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  mode === 'encrypt'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Encrypt
              </button>
              <button
                onClick={() => setMode('decrypt')}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  mode === 'decrypt'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Decrypt
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Algorithm
            </label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as EncryptionAlgorithm)}
              className="w-full px-3 py-2 bg-white border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {algorithms.map((algo) => (
                <option key={algo.value} value={algo.value}>
                  {algo.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Input Text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Enter text to ${mode}...`}
            className="w-full px-4 py-2 bg-white border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-32 resize-none"
          />
        </div>

        {algorithm !== 'base64' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter encryption/decryption key..."
              className="w-full px-4 py-2 bg-white border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        )}

        <button
          onClick={handleProcess}
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white py-2 rounded-lg hover:from-primary-700 hover:to-purple-700 flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : mode === 'encrypt' ? (
            <Lock className="w-4 h-4" />
          ) : (
            <Unlock className="w-4 h-4" />
          )}
          {loading ? 'Processing...' : mode === 'encrypt' ? 'Encrypt' : 'Decrypt'}
        </button>

        {result && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Result
            </label>
            <div className="relative">
              <textarea
                value={result}
                readOnly
                className="w-full px-4 py-2 bg-gray-50 border border-primary-200 rounded-lg h-32 resize-none"
              />
              <div className="absolute right-2 top-2 space-x-2">
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-gray-500 hover:text-gray-700 bg-white rounded-lg border border-gray-200 shadow-sm"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={handleSwap}
                  className="p-1.5 text-gray-500 hover:text-gray-700 bg-white rounded-lg border border-gray-200 shadow-sm"
                  title="Use as input"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}