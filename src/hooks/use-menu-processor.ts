import { useCallback } from 'react';
import { useMenuStore } from '@/store/menu-store';

export function useMenuProcessor() {
  const uploadedImages = useMenuStore((state) => state.uploadedImages);
  const setProgress = useMenuStore((state) => state.setProgress);
  const setIsProcessing = useMenuStore((state) => state.setIsProcessing);
  const setParsedMenu = useMenuStore((state) => state.setParsedMenu);
  const updateItemImage = useMenuStore((state) => state.updateItemImage);

  const processMenu = useCallback(async () => {
    if (!uploadedImages || uploadedImages.length === 0) return;

    setIsProcessing(true);
    setProgress({ stage: 'uploading', message: 'Starting...' });

    try {
      const response = await fetch('/api/process-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: uploadedImages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process menu');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const event = JSON.parse(line);

            switch (event.type) {
              case 'progress':
                setProgress({
                  stage: event.stage,
                  currentImage: event.currentImage,
                  totalImages: event.totalImages,
                  currentItem: event.currentItem,
                  totalItems: event.totalItems,
                  message: event.message,
                });
                break;
              case 'parsed':
                // DEBUG: Log what was parsed (visible in browser console)
                console.log('\n========== CLIENT: RECEIVED PARSED MENU ==========');
                console.log('Total dishes:', event.data.items.length);
                console.log('Language:', event.data.originalLanguage);
                console.table(event.data.items.map((item: any) => ({
                  Name: item.name,
                  'Translated': item.translatedName || 'N/A',
                  Price: item.price || 'N/A',
                  Category: item.category || 'N/A',
                })));
                console.log('==================================================\n');
                setParsedMenu(event.data);
                break;
              case 'image':
                updateItemImage(event.itemIndex, event.imageBase64);
                break;
              case 'complete':
                setProgress({ stage: 'complete', message: 'Done!' });
                break;
              case 'error':
                setProgress({ stage: 'error', message: event.message });
                break;
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';

      console.error('❌ MENU PROCESSING ERROR:', errorMessage);

      // Provide user-friendly error messages
      let userMessage = errorMessage;

      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        userMessage = 'Network error. Please check your connection and try again.';
      } else if (errorMessage.includes('timeout')) {
        userMessage = 'Request timed out. The menu image might be too large. Try a smaller image or try again.';
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        userMessage = 'API rate limit reached. Please wait a minute and try again.';
      }

      setProgress({
        stage: 'error',
        message: userMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [
    uploadedImages,
    setProgress,
    setIsProcessing,
    setParsedMenu,
    updateItemImage,
  ]);

  return { processMenu };
}
