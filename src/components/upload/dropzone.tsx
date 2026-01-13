'use client';

import { useCallback, useState } from 'react';
import { useUpload } from '@/hooks/use-upload';
import { useMenuStore } from '@/store/menu-store';

export function Dropzone() {
  const { handleFile, handleFiles } = useUpload();
  const uploadedImages = useMenuStore((state) => state.uploadedImages);
  const maxImages = useMenuStore((state) => state.maxImages);
  const removeUploadedImage = useMenuStore((state) => state.removeUploadedImage);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setError(null);

      const files = Array.from(e.dataTransfer.files).slice(0, maxImages);
      if (files.length > 0) {
        try {
          await handleFiles(files);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Upload failed');
        }
      }
    },
    [handleFiles, maxImages]
  );

  const onFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const files = e.target.files ? Array.from(e.target.files) : [];
      if (files.length > 0) {
        try {
          if (files.length === 1) {
            await handleFile(files[0]);
          } else {
            await handleFiles(files);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Upload failed');
        }
      }
    },
    [handleFile, handleFiles]
  );

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`
          border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer
          ${
            isDragging
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/50'
          }
        `}
      >
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={onFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer block">
          <div className="space-y-4">
            <div className="text-6xl">
              <span role="img" aria-label="camera">
                📸
              </span>
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-700">
                Drop up to {maxImages} menu photos here
              </p>
              <p className="text-gray-500 mt-1">or click to browse (can select multiple)</p>
            </div>
            <p className="text-sm text-gray-400">Supports JPEG, PNG, WebP, HEIC (max 10MB each)</p>
            {uploadedImages.length > 0 && (
              <p className="text-sm text-orange-600 font-medium">
                {uploadedImages.length} of {maxImages} images uploaded
              </p>
            )}
          </div>
        </label>
        {error && <p className="mt-4 text-red-500 text-sm font-medium">{error}</p>}
      </div>

      {uploadedImages.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Uploaded Images:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {uploadedImages.map((image, index) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                  <img
                    src={`data:${image.mimeType};base64,${image.base64}`}
                    alt={`Menu page ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute top-1 left-1 bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {index + 1}
                </div>
                <button
                  onClick={() => removeUploadedImage(image.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
