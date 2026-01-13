'use client';

import { useMenuStore } from '@/store/menu-store';

export function ImagePreview() {
  const { uploadedImages, clearUploadedImages } = useMenuStore();

  if (!uploadedImages || uploadedImages.length === 0) {
    return null;
  }

  // For backwards compatibility, show single image in large format
  if (uploadedImages.length === 1) {
    const image = uploadedImages[0];
    return (
      <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <img
          src={`data:${image.mimeType};base64,${image.base64}`}
          alt="Uploaded menu"
          className="w-full max-h-96 object-contain bg-gray-50"
        />
        <button
          onClick={clearUploadedImages}
          className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-600 hover:text-gray-900 rounded-full p-2 shadow-md transition-colors"
          aria-label="Remove image"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    );
  }

  // Note: For multiple images, the preview grid is now shown in the Dropzone component itself
  return null;
}
