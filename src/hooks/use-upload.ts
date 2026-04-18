import { useCallback } from 'react';
import { useMenuStore } from '@/store/menu-store';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

async function downsampleImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Scale dimensions so output JPEG is under MAX_FILE_SIZE
      const scale = Math.min(1, Math.sqrt(MAX_FILE_SIZE / file.size) * 0.9);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const mimeType = 'image/jpeg';
      let dataUrl = canvas.toDataURL(mimeType, 0.85);

      // If still over limit, reduce quality
      if (dataUrl.length * 0.75 > MAX_FILE_SIZE) {
        dataUrl = canvas.toDataURL(mimeType, 0.65);
      }

      resolve({ base64: dataUrl.split(',')[1], mimeType });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for downsampling'));
    };

    img.src = url;
  });
}

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
        const { base64, mimeType } = await downsampleImage(file);
        addUploadedImage(base64, mimeType);
        return;
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
