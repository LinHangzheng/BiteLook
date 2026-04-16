import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';
import { parseMenuImage, parseMultipleMenuImages } from '@/lib/google-ai/gemini-client';
import { generateDishImage } from '@/lib/google-ai/imagen-client';
import { validateInviteCode, getInviteCode } from '@/lib/validate-invite';
import { processConcurrently } from '@/lib/utils/concurrency-limiter';
import type { MenuImage, ProcessingProgress } from '@/types/menu';
import type { JobData, GeneratedImageData } from '@/types/job';
import { JOB_TTL_SECONDS } from '@/types/job';

// CORS headers for Capacitor native app requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Invite-Code',
};

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

async function updateJobState(
  jobId: string,
  updates: Partial<JobData>
): Promise<void> {
  try {
    const job = await kv.get<JobData>(`job:${jobId}`);
    if (!job) return;

    const updatedJob: JobData = {
      ...job,
      ...updates,
      updatedAt: Date.now(),
    };

    await kv.set(`job:${jobId}`, updatedJob, { ex: JOB_TTL_SECONDS });
  } catch (error) {
    console.error('Failed to update job state:', error);
  }
}

async function storeGeneratedImage(
  jobId: string,
  itemIndex: number,
  imageBase64: string | null,
  error?: string
): Promise<void> {
  try {
    const imageData: GeneratedImageData = { imageBase64, error };
    await kv.set(
      `job:${jobId}:images:${itemIndex}`,
      imageData,
      { ex: JOB_TTL_SECONDS }
    );
  } catch (err) {
    console.error('Failed to store generated image:', err);
  }
}

export async function POST(request: NextRequest) {
  // Validate invite code first
  const isValidated = await validateInviteCode();
  if (!isValidated) {
    return new Response(JSON.stringify({ error: 'Unauthorized - Invalid or missing invite code' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const body = await request.json();

  // Support both single and multi-image formats for backwards compatibility
  let images: MenuImage[];

  if (body.imageBase64 && body.mimeType) {
    // Single image format (old format)
    images = [{
      id: 'single',
      base64: body.imageBase64,
      mimeType: body.mimeType,
      order: 0,
    }];
  } else if (body.images && Array.isArray(body.images)) {
    // Multiple images format (new format)
    images = body.images;

    // Validate
    if (images.length === 0) {
      return new Response(JSON.stringify({ error: 'No images provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    if (images.length > 5) {
      return new Response(JSON.stringify({ error: 'Maximum 5 images allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  } else {
    return new Response(JSON.stringify({ error: 'Missing image data. Please provide either imageBase64 or images array.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Generate unique job ID
  const jobId = nanoid(12);

  // Get invite code for job association (from cookie or header)
  const inviteCode = await getInviteCode() || '';

  // Initialize job in KV
  const initialProgress: ProcessingProgress = {
    stage: 'uploading',
    message: 'Starting...',
  };

  const initialJob: JobData = {
    id: jobId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'pending',
    progress: initialProgress,
    parsedMenu: null,
    menuItems: [],
    error: null,
    inviteCode: inviteCode.toUpperCase(),
  };

  try {
    await kv.set(`job:${jobId}`, initialJob, { ex: JOB_TTL_SECONDS });
  } catch (error) {
    console.error('Failed to create job in KV:', error);
    // Continue without job persistence - still works for connected clients
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
      };

      // Send job ID immediately so client can poll if disconnected
      send({ type: 'job_created', jobId });

      try {
        // Update status to parsing
        await updateJobState(jobId, {
          status: 'parsing',
          progress: { stage: 'parsing', message: 'Starting menu analysis...' },
        });

        send({
          type: 'progress',
          stage: 'parsing',
          message: 'Starting menu analysis...',
        });

        // Progress callback to send real-time updates
        const onParsingProgress = async (message: string) => {
          await updateJobState(jobId, {
            progress: { stage: 'parsing', message },
          });
          send({
            type: 'progress',
            stage: 'parsing',
            message,
          });
        };

        const parsedMenu = images.length > 1
          ? await parseMultipleMenuImages(images, 3, onParsingProgress)
          : await parseMenuImage(images[0].base64, images[0].mimeType, 3, onParsingProgress);

        // DEBUG: Log parsed menu summary to server console
        console.log(`\n========== MENU PARSING COMPLETE ==========`);
        console.log(`Total dishes detected: ${parsedMenu.items.length}`);
        console.log(`Language: ${parsedMenu.originalLanguage}`);
        console.log(`Dishes: ${parsedMenu.items.map(item => item.name).join(', ')}`);
        console.log(`===========================================\n`);

        // Build menu items from parsed menu
        const menuItems = parsedMenu.items.map((item, i) => ({
          ...item,
          id: `dish-${i}`,
        }));

        // Update job with parsed menu
        await updateJobState(jobId, {
          status: 'generating',
          parsedMenu,
          menuItems,
          progress: {
            stage: 'parsing',
            message: `Found ${parsedMenu.items.length} dishes! Preparing to generate images...`,
          },
        });

        send({
          type: 'progress',
          stage: 'parsing',
          message: `Found ${parsedMenu.items.length} dishes! Preparing to generate images...`,
        });

        send({
          type: 'parsed',
          data: parsedMenu,
        });

        // Step 2: Generate images for each dish (in parallel with concurrency limit)
        const totalItems = parsedMenu.items.length;

        await updateJobState(jobId, {
          progress: {
            stage: 'generating',
            currentItem: 0,
            totalItems,
            message: `Generating images for ${totalItems} dishes (3 at a time)...`,
          },
        });

        send({
          type: 'progress',
          stage: 'generating',
          currentItem: 0,
          totalItems,
          message: `Generating images for ${totalItems} dishes (3 at a time)...`,
        });

        await processConcurrently(
          parsedMenu.items,
          async (item) => {
            const dishName = item.translatedName || item.name;

            try {
              const imageBase64Result = await generateDishImage(
                dishName,
                item.translatedDescription || item.description,
                item.ingredients
              );

              return imageBase64Result;
            } catch (err) {
              console.error(`Error generating image for ${dishName}:`, err);
              throw err;
            }
          },
          {
            concurrency: 3, // Only 3 concurrent requests for optimal performance
            onProgress: async (completed, total, result) => {
              // Store image in KV
              await storeGeneratedImage(
                jobId,
                result.index,
                result.success ? result.data || null : null,
                result.success ? undefined : result.error
              );

              // Update job progress
              await updateJobState(jobId, {
                progress: {
                  stage: 'generating',
                  currentItem: completed,
                  totalItems: total,
                  message: `Generated ${completed} of ${total} images...`,
                },
              });

              // Send result to client
              if (result.success && result.data) {
                send({
                  type: 'image',
                  itemIndex: result.index,
                  imageBase64: result.data,
                });
              } else {
                send({
                  type: 'image_error',
                  itemIndex: result.index,
                  error: result.error || 'Failed to generate image',
                });
              }

              // Update overall progress
              send({
                type: 'progress',
                stage: 'generating',
                currentItem: completed,
                totalItems: total,
                message: `Generated ${completed} of ${total} images...`,
              });
            },
            onError: (index, error) => {
              console.error(`Image generation failed for index ${index}:`, error);
            },
          }
        );

        // Mark job as completed
        await updateJobState(jobId, {
          status: 'completed',
          progress: { stage: 'complete', message: 'Done! Your visual menu is ready.' },
        });

        send({
          type: 'progress',
          stage: 'complete',
          message: 'Done! Your visual menu is ready.',
        });

        send({ type: 'complete', jobId });
      } catch (error) {
        console.error('❌ API PROCESSING ERROR:', error);
        const errorMessage = error instanceof Error ? error.message : 'Processing failed';

        // Provide user-friendly error messages
        let userMessage = errorMessage;

        if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
          userMessage = 'API rate limit exceeded. Please wait a minute and try again, or check your Google AI billing settings.';
        } else if (errorMessage.includes('API_KEY_INVALID')) {
          userMessage = 'Invalid API key. Please check your GOOGLE_GENAI_API_KEY in .env.local';
        } else if (errorMessage.includes('timeout') || errorMessage.includes('DEADLINE_EXCEEDED')) {
          userMessage = 'Request timed out. Your menu image might be too complex or large. Try a smaller image or fewer pages.';
        } else if (errorMessage.includes('Failed to parse menu')) {
          userMessage = 'Failed to understand menu structure. Please ensure the image is clear and text is readable.';
        } else {
          // Include error details for debugging
          userMessage = `Processing failed: ${errorMessage}. Please try again or contact support if the issue persists.`;
        }

        console.error('User-facing error message:', userMessage);

        // Store error in job
        await updateJobState(jobId, {
          status: 'failed',
          error: userMessage,
          progress: { stage: 'error', message: userMessage },
        });

        send({
          type: 'error',
          message: userMessage,
          jobId,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      ...corsHeaders,
    },
  });
}
