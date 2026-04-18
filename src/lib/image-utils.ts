const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

/**
 * Resize a base64 image to fit within MAX_DIMENSION while preserving aspect ratio.
 * Returns a JPEG base64 string (without the data URL prefix).
 */
export async function resizeImage(base64: string, mimeType: string): Promise<{ base64: string; mimeType: string }> {
  if (typeof document === 'undefined') {
    return { base64, mimeType };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Only resize if larger than MAX_DIMENSION
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        resolve({ base64, mimeType });
        return;
      }

      const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ base64, mimeType });
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      const resizedBase64 = dataUrl.split(',')[1];

      resolve({ base64: resizedBase64, mimeType: 'image/jpeg' });
    };
    img.onerror = () => resolve({ base64, mimeType });
    img.src = `data:${mimeType};base64,${base64}`;
  });
}
