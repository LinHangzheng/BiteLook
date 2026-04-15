'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useMenuStore } from '@/store/menu-store';
import { Dropzone } from '@/components/upload/dropzone';
import { FormatSelector } from '@/components/upload/format-selector';
import { InviteCodeForm } from '@/components/auth/invite-code-form';

export default function HomePage() {
  const router = useRouter();
  const { uploadedImages, isProcessing, progress, isValidated, logout } = useMenuStore();
  const [hasCookie, setHasCookie] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Double-check: verify both Zustand state AND cookie presence
  useEffect(() => {
    const cookieExists = !!Cookies.get('bitelook_invite_code');
    setHasCookie(cookieExists);
    setIsChecking(false);
  }, [isValidated]);

  // Show loading while checking
  if (isChecking) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-indigo-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </main>
    );
  }

  // Require BOTH validated state AND cookie to show main content
  const showMainContent = isValidated && hasCookie;

  const handleProcess = () => {
    router.push('/result');
  };

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3 tracking-tight">
            BiteLook
          </h1>
          <p className="text-base text-slate-500 max-w-md mx-auto">
            Transform any restaurant menu into a visual feast with AI-generated food images
          </p>
        </div>

        {/* Show invite code form if not validated OR no cookie */}
        {!showMainContent ? (
          <InviteCodeForm />
        ) : (
          <>
            {/* Main Content */}
            <div className="space-y-8">
              <Dropzone />

              {uploadedImages.length > 0 && (
                <>
                  <div>
                    <h2 className="text-sm font-medium text-slate-600 mb-3">
                      Choose display style
                    </h2>
                    <FormatSelector />
                  </div>

                  <button
                    onClick={handleProcess}
                    disabled={isProcessing}
                    className={`
                      w-full py-4 px-6 rounded-lg font-semibold text-base transition-all duration-200
                      ${
                        isProcessing
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
                      }
                    `}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        {progress?.message || 'Processing...'}
                      </span>
                    ) : (
                      'Visualize Menu'
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Features */}
            <div className="mt-16 grid grid-cols-3 gap-4 text-center">
              <div className="p-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                </div>
                <p className="text-sm text-slate-600 font-medium">Multi-language</p>
              </div>
              <div className="p-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-600 font-medium">AI food images</p>
              </div>
              <div className="p-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                </div>
                <p className="text-sm text-slate-600 font-medium">Mobile friendly</p>
              </div>
            </div>

            {/* Logout link */}
            <div className="mt-8 text-center">
              <button
                onClick={logout}
                className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
