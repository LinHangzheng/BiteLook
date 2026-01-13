import { useCallback } from 'react';
import { useMenuStore } from '@/store/menu-store';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export function useUpload() {
  const addUploadedImage = useMenuStore((state) => state.addUploadedImage);
  const uploadedImages = useMenuStore((state) => state.uploadedImages);
  const maxImages = useMenuStore((state) => state.maxImages);

  const handleFile = useCallback(
    async (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Invalid file type. Please upload JPEG, PNG, WebP, or HEIC.');
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File too large. Maximum size is 10MB.');
      }

      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          addUploadedImage(base64, file.type);
          resolve();
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    },
    [addUploadedImage]
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      // Validate total count
      if (uploadedImages.length + files.length > maxImages) {
        throw new Error(`Maximum ${maxImages} images allowed. You currently have ${uploadedImages.length} image(s).`);
      }

      // Process all files in parallel
      const promises = files.map((file) => handleFile(file));
      await Promise.all(promises);
    },
    [uploadedImages.length, maxImages, handleFile]
  );

  return { handleFile, handleFiles };
}
