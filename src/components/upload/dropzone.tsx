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
          border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer
          ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
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
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-slate-700">
                Drop up to {maxImages} menu photos here
              </p>
              <p className="text-slate-400 text-sm mt-1">or click to browse</p>
            </div>
            <p className="text-xs text-slate-400">Supports JPEG, PNG, WebP, HEIC (max 10MB each)</p>
            {uploadedImages.length > 0 && (
              <p className="text-xs text-indigo-600 font-medium">
                {uploadedImages.length} of {maxImages} images uploaded
              </p>
            )}
          </div>
        </label>
        {error && <p className="mt-4 text-red-500 text-sm font-medium">{error}</p>}
      </div>

      {uploadedImages.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Uploaded Images</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {uploadedImages.map((image, index) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                  <img
                    src={`data:${image.mimeType};base64,${image.base64}`}
                    alt={`Menu page ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute top-1.5 left-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-md w-5 h-5 flex items-center justify-center">
                  {index + 1}
                </div>
                <button
                  onClick={() => removeUploadedImage(image.id)}
                  className="absolute top-1.5 right-1.5 bg-slate-900/70 text-white rounded-md w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
