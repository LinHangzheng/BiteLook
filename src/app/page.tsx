'use client';

import { useRouter } from 'next/navigation';
import { useMenuStore } from '@/store/menu-store';
import { Dropzone } from '@/components/upload/dropzone';
import { ImagePreview } from '@/components/upload/image-preview';
import { FormatSelector } from '@/components/upload/format-selector';
import { InviteCodeForm } from '@/components/auth/invite-code-form';

export default function HomePage() {
  const router = useRouter();
  const { uploadedImage, isProcessing, progress, isValidated, logout } = useMenuStore();

  const handleProcess = () => {
    // Navigate immediately, processing happens on result page
    router.push('/result');
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            BiteLook
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Transform any restaurant menu into a visual feast with AI-generated food images
          </p>
        </div>

        {/* Show invite code form if not validated */}
        {!isValidated ? (
          <InviteCodeForm />
        ) : (
          <>
            {/* Main Content */}
            <div className="space-y-8">
              {!uploadedImage ? (
                <Dropzone />
              ) : (
                <>
                  <ImagePreview />

                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">
                      Choose display style
                    </h2>
                    <FormatSelector />
                  </div>

                  <button
                    onClick={handleProcess}
                    disabled={isProcessing}
                    className={`
                      w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200
                      ${
                        isProcessing
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl'
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
                <div className="text-3xl mb-2">🌍</div>
                <p className="text-sm text-gray-600">Multi-language support</p>
              </div>
              <div className="p-4">
                <div className="text-3xl mb-2">🖼️</div>
                <p className="text-sm text-gray-600">AI food images</p>
              </div>
              <div className="p-4">
                <div className="text-3xl mb-2">📱</div>
                <p className="text-sm text-gray-600">Mobile friendly</p>
              </div>
            </div>

            {/* Logout link */}
            <div className="mt-8 text-center">
              <button
                onClick={logout}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
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
