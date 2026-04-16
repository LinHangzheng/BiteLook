import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface CapturedImage {
  base64: string;
  mimeType: string;
}

/**
 * Hook for native camera functionality using Capacitor.
 * Falls back to web file input when not running in native app.
 */
export function useNativeCamera() {
  const isNative = Capacitor.isNativePlatform();

  /**
   * Take a photo using the native camera.
   * Only works in native Capacitor environment.
   */
  const takePhoto = async (): Promise<CapturedImage | null> => {
    if (!isNative) {
      console.warn('Native camera is only available in Capacitor apps');
      return null;
    }

    try {
      const photo: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        correctOrientation: true,
      });

      if (!photo.base64String) {
        return null;
      }

      return {
        base64: photo.base64String,
        mimeType: `image/${photo.format || 'jpeg'}`,
      };
    } catch (error) {
      console.error('Failed to take photo:', error);
      return null;
    }
  };

  /**
   * Pick a photo from the device gallery.
   * Only works in native Capacitor environment.
   */
  const pickFromGallery = async (): Promise<CapturedImage | null> => {
    if (!isNative) {
      console.warn('Native gallery picker is only available in Capacitor apps');
      return null;
    }

    try {
      const photo: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
        correctOrientation: true,
      });

      if (!photo.base64String) {
        return null;
      }

      return {
        base64: photo.base64String,
        mimeType: `image/${photo.format || 'jpeg'}`,
      };
    } catch (error) {
      console.error('Failed to pick photo:', error);
      return null;
    }
  };

  /**
   * Pick multiple photos from the device gallery.
   * Only works in native Capacitor environment.
   */
  const pickMultipleFromGallery = async (limit: number = 5): Promise<CapturedImage[]> => {
    if (!isNative) {
      console.warn('Native gallery picker is only available in Capacitor apps');
      return [];
    }

    try {
      const result = await Camera.pickImages({
        quality: 90,
        limit,
        correctOrientation: true,
      });

      const images: CapturedImage[] = [];

      for (const photo of result.photos) {
        // For pickImages, we need to read the file to get base64
        if (photo.webPath) {
          try {
            const response = await fetch(photo.webPath);
            const blob = await response.blob();
            const base64 = await blobToBase64(blob);
            images.push({
              base64,
              mimeType: blob.type || `image/${photo.format || 'jpeg'}`,
            });
          } catch (err) {
            console.error('Failed to convert image to base64:', err);
          }
        }
      }

      return images;
    } catch (error) {
      console.error('Failed to pick photos:', error);
      return [];
    }
  };

  /**
   * Show a prompt to either take a photo or pick from gallery.
   */
  const promptForPhoto = async (): Promise<CapturedImage | null> => {
    if (!isNative) {
      console.warn('Native camera prompt is only available in Capacitor apps');
      return null;
    }

    try {
      const photo: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt, // Shows choice between camera and gallery
        correctOrientation: true,
        promptLabelHeader: 'Menu Photo',
        promptLabelCancel: 'Cancel',
        promptLabelPhoto: 'From Gallery',
        promptLabelPicture: 'Take Photo',
      });

      if (!photo.base64String) {
        return null;
      }

      return {
        base64: photo.base64String,
        mimeType: `image/${photo.format || 'jpeg'}`,
      };
    } catch (error) {
      console.error('Failed to get photo:', error);
      return null;
    }
  };

  /**
   * Check camera permissions.
   */
  const checkPermissions = async () => {
    if (!isNative) {
      return { camera: 'granted', photos: 'granted' };
    }
    return await Camera.checkPermissions();
  };

  /**
   * Request camera permissions.
   */
  const requestPermissions = async () => {
    if (!isNative) {
      return { camera: 'granted', photos: 'granted' };
    }
    return await Camera.requestPermissions();
  };

  return {
    isNative,
    takePhoto,
    pickFromGallery,
    pickMultipleFromGallery,
    promptForPhoto,
    checkPermissions,
    requestPermissions,
  };
}

/**
 * Helper function to convert a Blob to base64 string.
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data URL prefix to get just the base64 string
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
