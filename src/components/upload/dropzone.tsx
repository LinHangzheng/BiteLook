'use client';

import { useCallback, useState } from 'react';
import { useUpload } from '@/hooks/use-upload';
import { useMenuStore } from '@/store/menu-store';
import { useNativeCamera } from '@/hooks/use-native-camera';
import { isNativeApp } from '@/lib/api-config';

export function Dropzone() {
  const { handleFile, handleFiles } = useUpload();
  const uploadedImages = useMenuStore((state) => state.uploadedImages);
  const maxImages = useMenuStore((state) => state.maxImages);
  const removeUploadedImage = useMenuStore((state) => state.removeUploadedImage);
  const addUploadedImage = useMenuStore((state) => state.addUploadedImage);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { promptForPhoto, pickMultipleFromGallery } = useNativeCamera();
  const isNative = isNativeApp();

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

  const handleTakePhoto = useCallback(async () => {
    setError(null);
    if (uploadedImages.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed.`);
      return;
    }
    try {
      const result = await promptForPhoto();
      if (result) {
        addUploadedImage(result.base64, result.mimeType);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture photo');
    }
  }, [promptForPhoto, addUploadedImage, uploadedImages.length, maxImages]);

  const handlePickFromGallery = useCallback(async () => {
    setError(null);
    const remaining = maxImages - uploadedImages.length;
    if (remaining <= 0) {
      setError(`Maximum ${maxImages} images allowed.`);
      return;
    }
    try {
      const results = await pickMultipleFromGallery(remaining);
      for (const img of results) {
        addUploadedImage(img.base64, img.mimeType);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pick photos');
    }
  }, [pickMultipleFromGallery, addUploadedImage, uploadedImages.length, maxImages]);

  return (
    <div className="space-y-6">
      {/* Native camera buttons (iOS/Android) */}
      {isNative && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleTakePhoto}
            disabled={uploadedImages.length >= maxImages}
            className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold text-sm transition-all hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            Take Photo
          </button>
          <button
            onClick={handlePickFromGallery}
            disabled={uploadedImages.length >= maxImages}
            className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-slate-200 bg-white text-slate-700 font-semibold text-sm transition-all hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            From Gallery
          </button>
        </div>
      )}

      {/* Standard drag & drop / file input */}
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
                {isNative ? 'Or browse files' : `Drop up to ${maxImages} menu photos here`}
              </p>
              {!isNative && <p className="text-slate-400 text-sm mt-1">or click to browse</p>}
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
