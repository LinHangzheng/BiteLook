'use client';

import { useState, useEffect } from 'react';
import { useMenuStore } from '@/store/menu-store';

const STORAGE_KEY = 'bitelook_invite_code';

export function InviteCodeForm() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStored, setIsCheckingStored] = useState(true);

  const { setInviteCode, setIsValidated } = useMenuStore();

  // Check for stored invite code on mount
  useEffect(() => {
    const storedCode = localStorage.getItem(STORAGE_KEY);
    if (storedCode) {
      validateCode(storedCode, true);
    } else {
      setIsCheckingStored(false);
    }
  }, []);

  const validateCode = async (codeToValidate: string, isStoredCode = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToValidate }),
      });

      const data = await response.json();

      if (data.valid) {
        localStorage.setItem(STORAGE_KEY, codeToValidate.toUpperCase());
        setInviteCode(codeToValidate.toUpperCase());
        setIsValidated(true);
      } else {
        if (isStoredCode) {
          // Stored code is no longer valid, remove it
          localStorage.removeItem(STORAGE_KEY);
        }
        setError(data.error || 'Invalid invite code');
        setIsCheckingStored(false);
      }
    } catch {
      setError('Failed to validate code. Please try again.');
      setIsCheckingStored(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      validateCode(code.trim());
    }
  };

  if (isCheckingStored) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4 animate-pulse">🔑</div>
        <p className="text-gray-600">Checking access...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔐</div>
          <h2 className="text-xl font-semibold text-gray-800">Enter Invite Code</h2>
          <p className="text-gray-500 text-sm mt-2">
            This app is currently in private beta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter your invite code"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center text-lg tracking-widest uppercase"
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className={`
              w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200
              ${
                isLoading || !code.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg'
              }
            `}
          >
            {isLoading ? 'Validating...' : 'Continue'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Need an invite code? Contact the app owner.
        </p>
      </div>
    </div>
  );
}
