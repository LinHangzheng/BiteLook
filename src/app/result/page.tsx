'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMenuStore } from '@/store/menu-store';
import { useMenuProcessor } from '@/hooks/use-menu-processor';
import { MenuContainer } from '@/components/menu/menu-container';
import { FormatSelector } from '@/components/upload/format-selector';

export default function ResultPage() {
  const router = useRouter();
  const { menuItems, progress, isProcessing, uploadedImages, isValidated, reset } = useMenuStore();
  const { processMenu } = useMenuProcessor();
  const hasStartedProcessing = useRef(false);

  // Redirect if not validated
  useEffect(() => {
    if (!isValidated) {
      console.log('Not validated, redirecting to home');
      router.push('/');
      return;
    }
  }, [isValidated, router]);

  // Start processing when page loads
  useEffect(() => {
    if (!isValidated) return; // Don't process if not validated

    if (uploadedImages.length > 0 && !hasStartedProcessing.current && !isProcessing && menuItems.length === 0) {
      hasStartedProcessing.current = true;
      processMenu();
    } else if (uploadedImages.length === 0 && menuItems.length === 0) {
      // No image uploaded, redirect to home
      router.push('/');
    }
  }, [uploadedImages.length, isProcessing, menuItems.length, processMenu, router, isValidated]);

  const progressPercent =
    progress?.totalItems && progress?.currentItem
      ? Math.round((progress.currentItem / progress.totalItems) * 100)
      : 0;

  const handleReset = () => {
    hasStartedProcessing.current = false;
    reset();
  };

  // Count how many images have been generated
  const imagesGenerated = menuItems.filter((item) => item.generatedImageBase64).length;

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Your Visual Menu</h1>
            {menuItems.length > 0 && (
              <p className="text-gray-600 mt-1">
                {menuItems.length} dishes found
                {progress?.stage === 'generating' && ` · ${imagesGenerated}/${menuItems.length} images`}
                {progress?.stage === 'complete' && ` · All images ready`}
              </p>
            )}
          </div>
          <Link
            href="/"
            onClick={handleReset}
            className="inline-flex items-center justify-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg"
          >
            Process Another Menu
          </Link>
        </div>

        {/* Progress indicator during processing */}
        {isProcessing && progress && (
          <div className="mb-8 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-700 font-medium">{progress.message}</span>
              {progress.stage === 'generating' && progress.totalItems && (
                <span className="text-gray-500">
                  {progress.currentItem || 0}/{progress.totalItems}
                </span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-orange-500 h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: progress.stage === 'parsing'
                    ? '10%'
                    : `${10 + (progressPercent * 0.9)}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Display mode toggle - show as soon as menu is parsed */}
        {menuItems.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-600 mb-3">Display Style</h2>
            <FormatSelector />
          </div>
        )}

        {/* Menu display - show immediately after parsing */}
        {menuItems.length > 0 && <MenuContainer />}

        {/* Loading state before menu is parsed */}
        {isProcessing && menuItems.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 animate-pulse">🍽️</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {progress?.message || 'Analyzing your menu...'}
            </h2>
            <p className="text-gray-500">This may take a few seconds</p>
          </div>
        )}

        {/* Empty state - no image uploaded */}
        {!isProcessing && menuItems.length === 0 && uploadedImages.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No menu processed yet</h2>
            <p className="text-gray-500 mb-6">Upload a menu photo to get started</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
            >
              Upload Menu
            </Link>
          </div>
        )}

        {/* Error state */}
        {progress?.stage === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <h3 className="text-red-800 font-semibold mb-2">Something went wrong</h3>
            <p className="text-red-600">{progress.message}</p>
            <Link
              href="/"
              onClick={handleReset}
              className="inline-block mt-4 text-red-700 hover:text-red-800 font-medium"
            >
              Try again
            </Link>
          </div>
        )}

        {/* Footer note */}
        {menuItems.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Images are AI-generated representations. Actual dishes may vary.
          </div>
        )}
      </div>
    </main>
  );
}
