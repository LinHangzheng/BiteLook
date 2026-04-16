import { useCallback, useRef, useEffect } from 'react';
import { useMenuStore } from '@/store/menu-store';
import { apiUrl } from '@/lib/api-config';
import { getAuthHeaders } from '@/lib/storage';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 300; // 10 minutes max (300 * 2s)

interface JobStatusResponse {
  jobId: string;
  status: string;
  progress: {
    stage: string;
    currentItem?: number;
    totalItems?: number;
    message: string;
  } | null;
  parsedMenu: {
    originalLanguage: string;
    items: Array<{
      name: string;
      description: string;
      price?: string;
      category?: string;
      ingredients?: string[];
      translatedName?: string;
      translatedDescription?: string;
    }>;
  } | null;
  generatedImages: Array<{
    itemIndex: number;
    imageBase64: string | null;
    error?: string;
  }>;
  error: string | null;
}

export function useMenuProcessor() {
  const uploadedImages = useMenuStore((state) => state.uploadedImages);
  const setProgress = useMenuStore((state) => state.setProgress);
  const setIsProcessing = useMenuStore((state) => state.setIsProcessing);
  const setParsedMenu = useMenuStore((state) => state.setParsedMenu);
  const updateItemImage = useMenuStore((state) => state.updateItemImage);
  const setJobId = useMenuStore((state) => state.setJobId);
  const jobId = useMenuStore((state) => state.jobId);

  const isPollingRef = useRef(false);
  const pollAttemptsRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Poll for job status
  const pollJobStatus = useCallback(async (currentJobId: string): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(apiUrl(`/api/job-status/${currentJobId}`), { headers });

      if (!response.ok) {
        if (response.status === 404) {
          setProgress({ stage: 'error', message: 'Job expired. Please try again.' });
          setIsProcessing(false);
          setJobId(null);
          return true; // Stop polling
        }
        throw new Error('Failed to fetch job status');
      }

      const data: JobStatusResponse = await response.json();

      // Update progress
      if (data.progress) {
        setProgress({
          stage: data.progress.stage as 'uploading' | 'parsing' | 'combining' | 'generating' | 'complete' | 'error',
          currentItem: data.progress.currentItem,
          totalItems: data.progress.totalItems,
          message: data.progress.message,
        });
      }

      // Update parsed menu if available
      if (data.parsedMenu && data.status !== 'pending') {
        setParsedMenu(data.parsedMenu);
      }

      // Update generated images
      if (data.generatedImages) {
        for (const img of data.generatedImages) {
          if (img.imageBase64) {
            updateItemImage(img.itemIndex, img.imageBase64);
          }
        }
      }

      // Check if job is complete or failed
      if (data.status === 'completed') {
        setProgress({ stage: 'complete', message: 'Done! Your visual menu is ready.' });
        setIsProcessing(false);
        setJobId(null);
        return true; // Stop polling
      }

      if (data.status === 'failed') {
        setProgress({ stage: 'error', message: data.error || 'Processing failed' });
        setIsProcessing(false);
        setJobId(null);
        return true; // Stop polling
      }

      return false; // Continue polling
    } catch (error) {
      console.error('Poll error:', error);
      return false; // Continue polling on error
    }
  }, [setProgress, setParsedMenu, updateItemImage, setIsProcessing, setJobId]);

  // Start polling loop
  const startPolling = useCallback(async (currentJobId: string) => {
    if (isPollingRef.current) return;

    isPollingRef.current = true;
    pollAttemptsRef.current = 0;

    console.log('Starting polling for job:', currentJobId);

    while (isPollingRef.current && pollAttemptsRef.current < MAX_POLL_ATTEMPTS) {
      const shouldStop = await pollJobStatus(currentJobId);
      if (shouldStop) {
        isPollingRef.current = false;
        break;
      }

      pollAttemptsRef.current++;
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
      setProgress({ stage: 'error', message: 'Processing timed out. Please try again.' });
      setIsProcessing(false);
      setJobId(null);
    }

    isPollingRef.current = false;
  }, [pollJobStatus, setProgress, setIsProcessing, setJobId]);

  // Stop polling
  const stopPolling = useCallback(() => {
    isPollingRef.current = false;
  }, []);

  const processMenu = useCallback(async () => {
    if (!uploadedImages || uploadedImages.length === 0) return;

    setIsProcessing(true);
    setProgress({ stage: 'uploading', message: 'Starting...' });

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(apiUrl('/api/process-menu'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          images: uploadedImages,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to process menu');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let currentJobId: string | null = null;

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
              case 'job_created':
                currentJobId = event.jobId;
                setJobId(event.jobId);
                break;
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
                console.table(event.data.items.map((item: { name: string; translatedName?: string; price?: string; category?: string }) => ({
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
                setJobId(null); // Clear job ID on completion
                break;
              case 'error':
                setProgress({ stage: 'error', message: event.message });
                setJobId(null); // Clear job ID on error
                break;
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      const errorName = error instanceof Error ? error.name : '';

      console.error('❌ MENU PROCESSING ERROR:', errorMessage);

      // Check if this is a disconnect/abort
      if (
        errorName === 'AbortError' ||
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('network') ||
        errorMessage.includes('The operation was aborted')
      ) {
        // Stream was disconnected, switch to polling
        const storedJobId = jobId || (typeof window !== 'undefined'
          ? localStorage.getItem('bitelook_current_job_id')
          : null);

        if (storedJobId) {
          console.log('Stream disconnected, switching to polling for job:', storedJobId);
          setProgress({
            stage: 'parsing',
            message: 'Reconnecting... Please wait.',
          });
          startPolling(storedJobId);
          return; // Don't set error, polling will handle it
        }
      }

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
      setJobId(null);
    } finally {
      if (!isPollingRef.current) {
        setIsProcessing(false);
      }
    }
  }, [
    uploadedImages,
    setProgress,
    setIsProcessing,
    setParsedMenu,
    updateItemImage,
    setJobId,
    jobId,
    startPolling,
  ]);

  // Recovery effect: check for existing job on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedJobId = localStorage.getItem('bitelook_current_job_id');
    if (storedJobId && !jobId) {
      console.log('Found existing job, attempting recovery:', storedJobId);
      setJobId(storedJobId);
      setIsProcessing(true);
      setProgress({ stage: 'parsing', message: 'Reconnecting to your processing job...' });
      startPolling(storedJobId);
    }
  }, []); // Only run once on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      abortControllerRef.current?.abort();
    };
  }, [stopPolling]);

  return { processMenu, stopPolling };
}
