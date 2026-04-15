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
  const {
    menuItems, progress, isProcessing, uploadedImages, isValidated, reset,
    imageGenerationCount, imageGenerationLimit,
  } = useMenuStore();
  const { processMenu } = useMenuProcessor();
  const hasStartedProcessing = useRef(false);

  // Redirect if not validated
  useEffect(() => {
    if (!isValidated) {
      router.push('/');
      return;
    }
  }, [isValidated, router]);

  // Start processing when page loads
  useEffect(() => {
    if (!isValidated) return;

    if (uploadedImages.length > 0 && !hasStartedProcessing.current && !isProcessing && menuItems.length === 0) {
      hasStartedProcessing.current = true;
      processMenu();
    } else if (uploadedImages.length === 0 && menuItems.length === 0) {
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
  const showOnDemandInfo = menuItems.length > 10;

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Your Visual Menu</h1>
            {menuItems.length > 0 && (
              <p className="text-slate-500 mt-1 text-sm">
                {menuItems.length} dishes found
                {progress?.stage === 'generating' && ` · ${imagesGenerated}/${menuItems.length} images`}
                {progress?.stage === 'complete' && !showOnDemandInfo && ` · All images ready`}
                {progress?.stage === 'complete' && showOnDemandInfo && ` · ${imageGenerationCount}/${imageGenerationLimit} images generated`}
              </p>
            )}
          </div>
          <Link
            href="/"
            onClick={handleReset}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md text-sm"
          >
            Process Another Menu
          </Link>
        </div>

        {/* On-demand info banner */}
        {showOnDemandInfo && menuItems.length > 0 && progress?.stage === 'complete' && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div>
              <p className="text-sm text-indigo-800 font-medium">On-demand image generation</p>
              <p className="text-sm text-indigo-600 mt-0.5">
                This menu has {menuItems.length} dishes. Click on individual dishes to generate images (up to {imageGenerationLimit} images).
                {imageGenerationCount > 0 && ` ${imageGenerationCount}/${imageGenerationLimit} used.`}
              </p>
            </div>
          </div>
        )}

        {/* Progress indicator during processing */}
        {isProcessing && progress && (
          <div className="mb-8 bg-white rounded-lg p-5 shadow-sm border border-slate-200">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-700 font-medium">{progress.message}</span>
              {progress.stage === 'generating' && progress.totalItems && (
                <span className="text-slate-400">
                  {progress.currentItem || 0}/{progress.totalItems}
                </span>
              )}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
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
            <h2 className="text-sm font-medium text-slate-500 mb-3">Display Style</h2>
            <FormatSelector />
          </div>
        )}

        {/* Menu display - show immediately after parsing */}
        {menuItems.length > 0 && <MenuContainer />}

        {/* Loading state before menu is parsed */}
        {isProcessing && menuItems.length === 0 && (
          <div className="text-center py-20">
            <svg className="animate-spin h-10 w-10 text-indigo-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <h2 className="text-lg font-semibold text-slate-700 mb-1">
              {progress?.message || 'Analyzing your menu...'}
            </h2>
            <p className="text-slate-400 text-sm">This may take a few seconds</p>
          </div>
        )}

        {/* Empty state - no image uploaded */}
        {!isProcessing && menuItems.length === 0 && uploadedImages.length === 0 && (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-700 mb-1">No menu processed yet</h2>
            <p className="text-slate-400 text-sm mb-6">Upload a menu photo to get started</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Upload Menu
            </Link>
          </div>
        )}

        {/* Error state */}
        {progress?.stage === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-5 mb-8">
            <h3 className="text-red-800 font-semibold text-sm mb-1">Something went wrong</h3>
            <p className="text-red-600 text-sm">{progress.message}</p>
            <Link
              href="/"
              onClick={handleReset}
              className="inline-block mt-3 text-red-700 hover:text-red-800 font-medium text-sm"
            >
              Try again
            </Link>
          </div>
        )}

        {/* Footer note */}
        {menuItems.length > 0 && (
          <div className="mt-8 text-center text-xs text-slate-400">
            Images are AI-generated representations. Actual dishes may vary.
          </div>
        )}
      </div>
    </main>
  );
}
