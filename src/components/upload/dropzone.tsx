'use client';

import { useCallback, useState } from 'react';
import { useUpload } from '@/hooks/use-upload';

export function Dropzone() {
  const { handleFile } = useUpload();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setError(null);

      const file = e.dataTransfer.files[0];
      if (file) {
        try {
          await handleFile(file);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Upload failed');
        }
      }
    },
    [handleFile]
  );

  const onFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const file = e.target.files?.[0];
      if (file) {
        try {
          await handleFile(file);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Upload failed');
        }
      }
    },
    [handleFile]
  );

  return (
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
            <p className="text-xl font-semibold text-gray-700">Drop your menu photo here</p>
            <p className="text-gray-500 mt-1">or click to browse</p>
          </div>
          <p className="text-sm text-gray-400">Supports JPEG, PNG, WebP, HEIC (max 10MB)</p>
        </div>
      </label>
      {error && <p className="mt-4 text-red-500 text-sm font-medium">{error}</p>}
    </div>
  );
}
