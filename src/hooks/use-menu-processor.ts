import { useCallback } from 'react';
import { useMenuStore } from '@/store/menu-store';

export function useMenuProcessor() {
  const uploadedImage = useMenuStore((state) => state.uploadedImage);
  const uploadedImageMimeType = useMenuStore((state) => state.uploadedImageMimeType);
  const setProgress = useMenuStore((state) => state.setProgress);
  const setIsProcessing = useMenuStore((state) => state.setIsProcessing);
  const setParsedMenu = useMenuStore((state) => state.setParsedMenu);
  const updateItemImage = useMenuStore((state) => state.updateItemImage);

  const processMenu = useCallback(async () => {
    if (!uploadedImage || !uploadedImageMimeType) return;

    setIsProcessing(true);
    setProgress({ stage: 'uploading', message: 'Starting...' });

    try {
      const response = await fetch('/api/process-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: uploadedImage,
          mimeType: uploadedImageMimeType,
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
                  currentItem: event.currentItem,
                  totalItems: event.totalItems,
                  message: event.message,
                });
                break;
              case 'parsed':
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
      setProgress({
        stage: 'error',
        message: error instanceof Error ? error.message : 'Processing failed',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [
    uploadedImage,
    uploadedImageMimeType,
    setProgress,
    setIsProcessing,
    setParsedMenu,
    updateItemImage,
  ]);

  return { processMenu };
}
