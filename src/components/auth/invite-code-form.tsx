'use client';

import { useState, useEffect } from 'react';
import { useMenuStore } from '@/store/menu-store';
import { storage } from '@/lib/storage';
import { apiUrl } from '@/lib/api-config';

export function InviteCodeForm() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStored, setIsCheckingStored] = useState(true);

  const { setInviteCode, setIsValidated } = useMenuStore();

  useEffect(() => {
    storage.getInviteCode().then((storedCode) => {
      if (storedCode) {
        validateCode(storedCode, true);
      } else {
        setIsCheckingStored(false);
      }
    });
  }, []);

  const validateCode = async (codeToValidate: string, isStoredCode = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl('/api/validate-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToValidate }),
      });

      const data = await response.json();

      if (data.valid) {
        await storage.setInviteCode(codeToValidate.toUpperCase());
        setInviteCode(codeToValidate.toUpperCase());
        setIsValidated(true);
      } else {
        if (isStoredCode) {
          await storage.removeInviteCode();
        }

        if (response.status === 503) {
          setError('System not configured. Please contact the administrator.');
        } else {
          setError(data.error || 'Invalid invite code');
        }
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
        <svg className="animate-spin h-8 w-8 text-indigo-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-slate-500 text-sm">Checking access...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-800">Enter Invite Code</h2>
          <p className="text-slate-400 text-sm mt-1">
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
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-base tracking-widest uppercase bg-slate-50 placeholder:text-slate-300"
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
              w-full py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-200
              ${
                isLoading || !code.trim()
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md'
              }
            `}
          >
            {isLoading ? 'Validating...' : 'Continue'}
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-6">
          Need an invite code? Contact the app owner.
        </p>
      </div>
    </div>
  );
}
